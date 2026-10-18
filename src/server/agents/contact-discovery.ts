import { Agent, AgentContext, AgentResult } from './types';
import { pluginRegistry } from '../plugins';
import { HunterPlugin, ApolloPlugin } from '../plugins/contact-discovery';
import { SocialAnalyzerPlugin } from '../plugins/social-analyzer';
import { assessLeadDataQuality, normalizeDomain, validateEmail, validatePhone } from '../services/data-quality';

export class ContactDiscoveryAgent implements Agent {
  type = 'contact-discovery' as const;
  name = 'Contact & Email Discovery Agent';
  description = 'Discovers contacts from configured providers and records field-level data quality';

  async execute(context: AgentContext): Promise<AgentResult> {
    const { leads, onLog } = context;
    const hunter = pluginRegistry.get<HunterPlugin>('hunter');
    const apollo = pluginRegistry.get<ApolloPlugin>('apollo');
    const social = pluginRegistry.get<SocialAnalyzerPlugin>('social-analyzer');
    onLog({ agent: this.name, level: 'info', message: `Starting contact discovery for ${leads.length} businesses...` });
    let processed = 0;
    const batchSize = 5;

    for (let i = 0; i < leads.length; i += batchSize) {
      await Promise.all(leads.slice(i, i + batchSize).map(async (lead) => {
        try {
          const domain = normalizeDomain(lead.website);
          const [hunterResult, apolloResult, socialResult] = await Promise.all([
            domain && hunter ? hunter.execute({ domain, companyName: lead.name }) : Promise.resolve(null),
            apollo ? apollo.execute({ companyName: lead.name, city: lead.city, title: context.criteria.targetJobTitle }) : Promise.resolve(null),
            social ? social.execute({ businessName: lead.name, website: lead.website, city: lead.city }) : Promise.resolve(null),
          ]);

          if (hunterResult?.success && hunterResult.data) {
            const emails = hunterResult.data.emails || [];
            const businessEmail = emails.find((e) => e.type === 'business') || emails.find((e) => e.type === 'info') || emails[0];
            const ownerEmail = emails.find((e) => e.type === 'owner');
            if (businessEmail?.address && validateEmail(businessEmail.address).status === 'plausible' && !lead.email) lead.email = businessEmail.address;
            if (ownerEmail && hunterResult.data.ownerName) lead.ownerName = hunterResult.data.ownerName;
            if (hunterResult.data.phone && !lead.phone && validatePhone(hunterResult.data.phone).status === 'plausible') lead.phone = hunterResult.data.phone;
            if (hunterResult.data.socialProfiles) {
              const s = hunterResult.data.socialProfiles;
              lead.socials = { ...lead.socials, facebook: s.facebook || lead.socials?.facebook, instagram: s.instagram || lead.socials?.instagram, linkedin: s.linkedin || lead.socials?.linkedin, x: s.twitter || lead.socials?.x };
            }
          }

          if (apolloResult?.success && apolloResult.data) {
            if (!lead.email) {
              const candidate = (apolloResult.data.emails || []).find((e) => validateEmail(e.address).status === 'plausible');
              if (candidate) lead.email = candidate.address;
            }
            if (!lead.ownerName && apolloResult.data.ownerName) lead.ownerName = apolloResult.data.ownerName;
            if (!lead.phone && apolloResult.data.phone && validatePhone(apolloResult.data.phone).status === 'plausible') lead.phone = apolloResult.data.phone;
            if (apolloResult.data.ownerName || apolloResult.data.ownerTitle || apolloResult.data.phone) {
              lead.hrContact = {
                name: apolloResult.data.ownerName,
                title: apolloResult.data.ownerTitle,
                email: (apolloResult.data.emails || []).find((e) => e.type === 'owner' && validateEmail(e.address).status === 'plausible')?.address,
                phone: apolloResult.data.phone && validatePhone(apolloResult.data.phone).status === 'plausible' ? apolloResult.data.phone : undefined,
              };
            }
          }

          if (socialResult?.success && socialResult.data) {
            for (const profile of socialResult.data.profiles || []) {
              const url = profile.url;
              const platform = profile.platform.toLowerCase();
              if (platform.includes('facebook')) lead.socials.facebook = url;
              else if (platform.includes('instagram')) lead.socials.instagram = url;
              else if (platform.includes('linkedin')) lead.socials.linkedin = url;
              else if (platform === 'x' || platform.includes('twitter')) lead.socials.x = url;
              else if (platform.includes('tiktok')) lead.socials.tiktok = url;
              else if (platform.includes('youtube')) lead.socials.youtube = url;
              else if (platform.includes('threads')) lead.socials.threads = url;
            }
          }

          lead.dataQuality = assessLeadDataQuality({ email: lead.email, phone: lead.phone, website: lead.website, address: lead.address, socials: lead.socials, sources: { email: hunterResult?.success && hunterResult.data?.emails?.some((e) => e.address === lead.email) ? hunterResult.source : apolloResult?.success && apolloResult.data?.emails?.some((e) => e.address === lead.email) ? apolloResult.source : undefined, phone: apolloResult?.success && apolloResult.data?.phone === lead.phone ? apolloResult.source : hunterResult?.success && hunterResult.data?.phone === lead.phone ? hunterResult.source : undefined, website: lead.website ? (lead.googleMapsUrl ? 'Google Places website field' : 'Website URL; source not independently confirmed') : undefined, address: lead.address ? (lead.googleMapsUrl ? 'Google Places address field' : undefined) : undefined, socials: socialResult?.success ? socialResult.source : hunterResult?.success && hunterResult.data?.socialProfiles ? hunterResult.source : undefined } });
          lead.verificationStatus = 'Enriched';
          processed++;
        } catch (error) {
          onLog({ agent: this.name, level: 'warning', message: `Contact discovery partial for ${lead.name}: ${error instanceof Error ? error.message : 'unknown error'}` });
          lead.dataQuality = assessLeadDataQuality({ email: lead.email, phone: lead.phone, website: lead.website, address: lead.address, socials: lead.socials });
          processed++;
        }
      }));
      if (processed % 10 === 0 || i + batchSize >= leads.length) onLog({ agent: this.name, level: 'info', message: `Processed ${processed}/${leads.length} contact records` });
    }
    onLog({ agent: this.name, level: 'success', message: `Contact discovery complete: ${processed} records checked; missing fields remain explicitly missing` });
    return { success: true, leads, itemsProcessed: processed };
  }
}
