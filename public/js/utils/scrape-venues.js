const { JSDOM } = require('jsdom');
const getVenues = require('./get-venues');
const moment = require('moment');
const pool = require('./db');
const scrapers = require('../../../server/venues');

const scrapeVenues = async () => {
	console.log("Start scraping venues");
	const venues = await getVenues({});
	for (const venue of venues) {
		try {
			const { slug, name, url } = venue;
			const scraper = scrapers[slug];
			if (!scraper) {
				console.log(`No scraper found for ${slug}, skipping`);
				continue;
			}
			if (!url) {
				console.log(`No URL set for ${name}, skipping`);
				continue;
			}

			const pageHTMLAsText = await fetch(url).then(r => r.text());
			const { document } = new JSDOM(pageHTMLAsText).window;
			const events = scraper.getAllEvents(document);
			console.log(`Found ${events.length} events at ${slug}`);

			const valueParts = [];
			events.forEach(event => {
				const {
					date,
					title,
					image_url,
					time,
					cost,
					description,
					link
				} = event;
				if (moment(new Date(date)).isAfter(moment(new Date), 'day')) {
					valueParts.push(`('${date ? moment(new Date(date)).toISOString() : ''}', '${title ? title.replace(/'/g, "") : ''}', '${image_url || ''}', '${time || ''}', ${cost ? `'${cost}'` : 'NULL'}, '${description ? description.replace(/'/g, "") : ''}', '${link}', '${slug}')`);
				}
			});

			if (valueParts.length) {
				console.log(`Executing insert queries for ${name}`);
				await pool.query(`INSERT INTO events (date, title, image_url, time, cost, description, link, venue) VALUES ${valueParts.join(', ')}`);
			}
		} catch (err) {
			console.log(`Error scraping ${venue.slug}:`, err.message);
		}
	}
	console.log("Successfully inserted events into DB");
};

module.exports = scrapeVenues;

scrapeVenues();
