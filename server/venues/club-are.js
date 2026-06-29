const { JSDOM } = require('jsdom');

const SITEMAP = 'https://www.clubare.org/event-pages-sitemap.xml';

const fetchEvents = async () => {
	const sitemapXml = await fetch(SITEMAP, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.text());
	const { document } = new JSDOM(sitemapXml, { contentType: 'text/xml' }).window;

	const today = new Date(); today.setHours(0, 0, 0, 0);
	const cutoff = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

	const urls = Array.from(document.querySelectorAll('url'))
		.map(u => ({
			loc: u.querySelector('loc')?.textContent,
			lastmod: u.querySelector('lastmod')?.textContent,
		}))
		.filter(u => u.loc && u.loc.includes('/events/') && u.lastmod && new Date(u.lastmod) >= cutoff);

	const events = [];
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
			events.push({ title: data.name, date, time, link: loc, image_url: '' });
		} catch (_) {}
	}

	return events.sort((a, b) => a.date - b.date);
};

const getEventDetails = () => ({});
module.exports = { fetchEvents, getEventDetails };
