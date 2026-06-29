const { JSDOM } = require('jsdom');
const moment = require('moment');
const pool = require('./db');
const scrapers = require('../../../server/venues');

const scrapeVenues = async () => {
	console.log("Start scraping venues");
	const { rows: venues } = await pool.query("SELECT * FROM venues WHERE active = 'TRUE'");
	const results = [];

	for (const venue of venues) {
		const { slug, name, url } = venue;
		const result = { name, slug, eventsInserted: 0, error: null };

		const scraper = scrapers[slug];
		if (!scraper) {
			result.error = 'No scraper found';
			results.push(result);
			continue;
		}
		if (!scraper.fetchEvents && !url) {
			result.error = 'No URL set';
			results.push(result);
			continue;
		}

		try {
			let events;
			if (scraper.fetchEvents) {
				events = await scraper.fetchEvents();
			} else {
				const pageHTMLAsText = await fetch(url).then(r => r.text());
				const { document } = new JSDOM(pageHTMLAsText).window;
				events = scraper.getAllEvents(document);
			}

			const valueParts = [];
			events.forEach(event => {
				const { date, title, image_url, time, cost, description, link } = event;
				if (moment(new Date(date)).isAfter(moment(new Date), 'day')) {
					valueParts.push(`('${date ? moment(new Date(date)).toISOString() : ''}', '${title ? title.replace(/'/g, "") : ''}', '${image_url || ''}', '${time || ''}', ${cost ? `'${cost}'` : 'NULL'}, '${description ? description.replace(/'/g, "") : ''}', '${link}', '${slug}')`);
				}
			});

			if (valueParts.length) {
				await pool.query(`INSERT INTO events (date, title, image_url, time, cost, description, link, venue) VALUES ${valueParts.join(', ')}`);
			}
			result.eventsInserted = valueParts.length;
		} catch (err) {
			console.log(`Error scraping ${slug}:`, err.message);
			result.error = err.message;
		}

		results.push(result);
	}

	console.log("Finished scraping venues");
	return results;
};

module.exports = scrapeVenues;
