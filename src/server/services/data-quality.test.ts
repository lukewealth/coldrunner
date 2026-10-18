import test from 'node:test';
import assert from 'node:assert/strict';
import { assessLeadDataQuality, normalizeDomain, validateEmail, validatePhone, validateSocials, validateWebsite } from './data-quality';

test('normalizes domains without paths and rejects malformed values', () => {
  assert.equal(normalizeDomain('https://www.example.org/about'), 'example.org');
  assert.equal(normalizeDomain('not a url %%%'), '');
});

test('email validation does not claim mailbox verification', () => {
  assert.equal(validateEmail('hello@example.com').status, 'invalid');
  const result = validateEmail('hello@real-domain.org');
  assert.equal(result.status, 'plausible');
  assert.match(result.reason, /not confirmed/);
});

test('rejects placeholder phone numbers and accepts plausible international digits', () => {
  assert.equal(validatePhone('+1 (212) 555-0100').status, 'invalid');
  assert.equal(validatePhone('+234 803 123 4567').status, 'plausible');
});

test('social validation rejects arbitrary hostnames', () => {
  assert.equal(validateSocials({ instagram: 'https://instagram.com/brand' }).status, 'plausible');
  assert.equal(validateSocials({ instagram: 'https://instagram.com.evil.example/brand' }).status, 'invalid');
});

test('quality score is explicitly a completeness/format score with source provenance', () => {
  const result = assessLeadDataQuality({
    email: 'hello@brand.org',
    website: 'https://brand.org',
    address: '123 Main Street',
    socials: { instagram: 'https://instagram.com/brand' },
    sources: { email: 'Hunter.io API', website: 'Google Places website field' },
  });
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.equal(result.fields.email.source, 'Hunter.io API');
  assert.equal(result.fields.phone.status, 'missing');
});
