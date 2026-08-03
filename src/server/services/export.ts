import { BusinessLead, ExportOptions } from '../types';

export class ExportService {
  generateCSV(leads: BusinessLead[], options?: { includeAudit?: boolean; includeSocials?: boolean }): string {
    const headers = [
      'Business Name', 'Category', 'Country', 'Province/State', 'City',
      'Rating', 'Reviews', 'Opportunity Score', 'Lead Quality',
      'Website', 'Website Status', 'Website Technology',
      'SEO Score', 'Performance Score', 'Accessibility Score', 'SSL',
      'Phone', 'Business Email', 'Owner Name',
      'Facebook', 'Instagram', 'LinkedIn', 'TikTok',
      'Address', 'Google Maps URL', 'Latitude', 'Longitude',
      'Recommended Service', 'Revenue Estimate', 'Confidence Score',
      'Research Date',
    ];

    if (options?.includeSocials) {
      headers.push('WhatsApp', 'Twitter/X', 'YouTube', 'Threads');
    }

    const rows = leads.map((l) => [
      this.csvEscape(l.name),
      this.csvEscape(l.category),
      this.csvEscape(l.country),
      this.csvEscape(l.province),
      this.csvEscape(l.city),
      l.rating,
      l.reviewCount,
      l.opportunityScore,
      l.grade,
      this.csvEscape(l.website),
      this.csvEscape(l.websiteStatus),
      this.csvEscape(l.audit.techStack.join('; ')),
      l.audit.seo,
      l.audit.performance,
      l.audit.accessibility,
      l.audit.hasSSL ? 'Yes' : 'No',
      this.csvEscape(l.phone),
      this.csvEscape(l.email),
      this.csvEscape(l.ownerName || ''),
      this.csvEscape(l.socials.facebook || ''),
      this.csvEscape(l.socials.instagram || ''),
      this.csvEscape(l.socials.linkedin || ''),
      this.csvEscape(l.socials.tiktok || ''),
      this.csvEscape(l.address),
      this.csvEscape(l.googleMapsUrl || ''),
      l.lat,
      l.lng,
      this.csvEscape(l.recommendedService),
      this.csvEscape(l.estimatedRevenue),
      l.dataConfidence,
      l.lastUpdated,
      ...(options?.includeSocials ? [
        this.csvEscape(l.socials.whatsapp || ''),
        this.csvEscape(l.socials.x || ''),
        this.csvEscape(l.socials.youtube || ''),
        this.csvEscape(l.socials.threads || ''),
      ] : []),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  generateJSON(leads: BusinessLead[], city?: string, province?: string, country?: string): string {
    const output = {
      city: city || '',
      province: province || '',
      country: country || '',
      totalBusinesses: leads.length,
      generatedAt: new Date().toISOString(),
      businesses: leads.map((l) => ({
        name: l.name,
        category: l.category,
        location: {
          country: l.country,
          province: l.province,
          city: l.city,
          address: l.address,
          lat: l.lat,
          lng: l.lng,
        },
        contact: {
          phone: l.phone,
          email: l.email,
          owner: l.ownerName,
          hrContact: l.hrContact,
        },
        google: {
          rating: l.rating,
          reviewCount: l.reviewCount,
          placeId: l.placeId,
          mapsUrl: l.googleMapsUrl,
          openingHours: l.openingHours,
        },
        website: {
          url: l.website,
          status: l.websiteStatus,
          audit: l.audit,
        },
        social: l.socials,
        opportunity: {
          score: l.opportunityScore,
          grade: l.grade,
          recommendedService: l.recommendedService,
          estimatedRevenue: l.estimatedRevenue,
          aiInsights: l.aiInsights,
        },
        dataConfidence: l.dataConfidence,
        verificationStatus: l.verificationStatus,
        researchDate: l.lastUpdated,
      })),
    };

    return JSON.stringify(output, null, 2);
  }

  generateMarkdown(leads: BusinessLead[], city?: string, province?: string, country?: string): string {
    const hotLeads = leads.filter((l) => l.grade === 'HOT');
    const categories: Record<string, number> = {};
    const websiteStatuses: Record<string, number> = {};

    leads.forEach((l) => {
      categories[l.category] = (categories[l.category] || 0) + 1;
      websiteStatuses[l.websiteStatus] = (websiteStatuses[l.websiteStatus] || 0) + 1;
    });

    const avgRating = leads.length > 0 ? (leads.reduce((s, l) => s + l.rating, 0) / leads.length).toFixed(1) : '0';
    const avgReviews = leads.length > 0 ? Math.round(leads.reduce((s, l) => s + l.reviewCount, 0) / leads.length) : 0;
    const avgScore = leads.length > 0 ? Math.round(leads.reduce((s, l) => s + l.opportunityScore, 0) / leads.length) : 0;

    let md = `# ${city || 'City'} Business Intelligence Report\n\n`;
    md += `**Generated:** ${new Date().toLocaleDateString()} | **Total Businesses:** ${leads.length} | **Country:** ${country || 'N/A'}\n\n`;
    md += `---\n\n`;
    md += `## Summary\n\n`;
    md += `| Metric | Value |\n|---|---|\n`;
    md += `| Total Businesses | ${leads.length} |\n`;
    md += `| HOT Leads | ${hotLeads.length} |\n`;
    md += `| Average Rating | ${avgRating} |\n`;
    md += `| Average Reviews | ${avgReviews} |\n`;
    md += `| Average Opportunity Score | ${avgScore}% |\n\n`;

    md += `## Website Distribution\n\n`;
    md += `| Status | Count |\n|---|---|\n`;
    Object.entries(websiteStatuses).forEach(([status, count]) => {
      md += `| ${status} | ${count} |\n`;
    });

    md += `\n## Top Industries\n\n`;
    md += `| Industry | Count |\n|---|---|\n`;
    Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
      md += `| ${cat} | ${count} |\n`;
    });

    md += `\n## Top 20 HOT Leads\n\n`;
    md += `| # | Business | Category | Score | Website | Recommended Service |\n`;
    md += `|---|---|---|---|---|---|\n`;
    hotLeads.slice(0, 20).forEach((l, i) => {
      md += `| ${i + 1} | ${l.name} | ${l.category} | ${l.opportunityScore}% | ${l.websiteStatus} | ${l.recommendedService} |\n`;
    });

    md += `\n## Full Business Directory\n\n`;
    leads.forEach((l, i) => {
      md += `### ${i + 1}. ${l.name}\n\n`;
      md += `- **Category:** ${l.category}\n`;
      md += `- **Location:** ${l.address}\n`;
      md += `- **Rating:** ${l.rating}/5 (${l.reviewCount} reviews)\n`;
      md += `- **Opportunity Score:** ${l.opportunityScore}% (${l.grade})\n`;
      md += `- **Website:** ${l.website || 'N/A'} (${l.websiteStatus})\n`;
      md += `- **Phone:** ${l.phone}\n`;
      md += `- **Email:** ${l.email}\n`;
      md += `- **Est. Revenue:** ${l.estimatedRevenue}\n`;
      md += `- **Recommended:** ${l.recommendedService}\n`;
      md += `- **Insights:** ${l.aiInsights}\n\n`;
    });

    md += `---\n\n*Report generated by ColdRunners Business Intelligence Platform*\n`;
    return md;
  }

  generateExcelXML(leads: BusinessLead[]): string {
    const headers = ['Business Name', 'Category', 'City', 'Province', 'Country', 'Rating', 'Reviews', 'Opportunity Score', 'Grade', 'Website', 'Website Status', 'Phone', 'Email', 'Owner', 'Revenue', 'Recommended Service'];
    
    let xml = '<?xml version="1.0"?>\n';
    xml += '<?mso-application progid="Excel.Sheet"?>\n';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xml += '<Worksheet ss:Name="Leads"><Table>\n';
    
    xml += '<Row>';
    headers.forEach((h) => { xml += `<Cell><Data ss:Type="String">${this.xmlEscape(h)}</Data></Cell>`; });
    xml += '</Row>\n';

    leads.forEach((l) => {
      xml += '<Row>';
      xml += `<Cell><Data ss:Type="String">${this.xmlEscape(l.name)}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="String">${this.xmlEscape(l.category)}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="String">${this.xmlEscape(l.city)}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="String">${this.xmlEscape(l.province)}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="String">${this.xmlEscape(l.country)}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="Number">${l.rating}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="Number">${l.reviewCount}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="Number">${l.opportunityScore}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="String">${l.grade}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="String">${this.xmlEscape(l.website)}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="String">${this.xmlEscape(l.websiteStatus)}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="String">${this.xmlEscape(l.phone)}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="String">${this.xmlEscape(l.email)}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="String">${this.xmlEscape(l.ownerName || '')}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="String">${this.xmlEscape(l.estimatedRevenue)}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="String">${this.xmlEscape(l.recommendedService)}</Data></Cell>`;
      xml += '</Row>\n';
    });

    xml += '</Table></Worksheet></Workbook>';
    return xml;
  }

  private csvEscape(value: string): string {
    if (!value) return '""';
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return `"${value}"`;
  }

  private xmlEscape(value: string): string {
    if (!value) return '';
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

export const exportService = new ExportService();
