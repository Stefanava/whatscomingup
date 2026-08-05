// Every venue's scraping strategy is DB config — nothing venue-specific lives
// in code. A venue is one of:
//   - provider = 'ra' | 'skiddle' | 'rest-json' | 'jsonld-sitemap'  (structured APIs)
//   - provider = 'ai', or no provider at all                        (LLM extraction against `url`)
// Adding a new venue of any of these shapes is a DB row, never a new file.

import { makeRAScraper } from './ra-client.ts';
import { makeSkiddleScraper } from './skiddle-client.ts';
import { makeRestJsonScraper } from './rest-json-client.ts';
import { makeJsonLdSitemapScraper } from './jsonld-sitemap-client.ts';
import { makeAIScraper } from './ai-client.ts';

export function resolveScraper(venue: { url: string | null; provider?: string; provider_config?: any }) {
	if (venue.provider === 'ra') return makeRAScraper(venue.provider_config.promoterId);
	if (venue.provider === 'skiddle') return makeSkiddleScraper(venue.provider_config);
	if (venue.provider === 'rest-json') return makeRestJsonScraper(venue.provider_config);
	if (venue.provider === 'jsonld-sitemap') return makeJsonLdSitemapScraper(venue.provider_config);
	if (venue.url) return makeAIScraper(venue.url, venue.provider === 'ai' ? venue.provider_config : {});
	return null;
}
