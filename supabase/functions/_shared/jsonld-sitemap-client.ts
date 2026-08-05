// Generic "crawl a sitemap, read schema.org Event JSON-LD off each matching
// page" provider. Generalizes what used to be a bespoke club-are.ts —
// schema.org Event markup is a real, reasonably common standard for event
// sites (WordPress/Squarespace event plugins, etc.), so this isn't
// single-venue-specific machinery. provider_config shape:
//
//   { sitemapUrl: "https://.../sitemap.xml", urlPattern: "/events/", lookbackDays: 90 }

type JsonLdSitemapConfig = {
	sitemapUrl: string;
	urlPattern: string;
	lookbackDays: number;
};

export function makeJsonLdSitemapScraper(config: JsonLdSitemapConfig) {
	const fetchEvents = async () => {
		const sitemapXml = await fetch(config.sitemapUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.text());

		const today = new Date(); today.setHours(0, 0, 0, 0);
		const cutoff = new Date(today.getTime() - config.lookbackDays * 24 * 60 * 60 * 1000);

		const urlBlocks = sitemapXml.match(/<url>[\s\S]*?<\/url>/g) || [];
		const urls = urlBlocks
			.map(block => ({
				loc: block.match(/<loc>([^<]+)<\/loc>/)?.[1],
				lastmod: block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1],
			}))
			.filter((u): u is { loc: string; lastmod: string } =>
				!!u.loc && u.loc.includes(config.urlPattern) && !!u.lastmod && new Date(u.lastmod) >= cutoff);

		const events: any[] = [];
		for (const { loc } of urls) {
			try {
				const html = await fetch(loc, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.text());
				const match = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
				if (!match) continue;
				const data = JSON.parse(match[1]);
				if (data['@type'] !== 'Event') continue;

				const date = new Date(data.startDate);
				if (date < today) continue;

				const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
				events.push({ title: data.name, date, time, link: loc, image_url: data.image || '' });
			} catch (_) { /* skip unparsable pages */ }
		}

		return events.sort((a, b) => a.date - b.date);
	};

	const getEventDetails = () => ({});

	return { fetchEvents, getEventDetails };
}
