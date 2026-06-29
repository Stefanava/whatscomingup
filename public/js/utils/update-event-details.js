const pool = require('./db');
const getEvents = require('./get-events');
const { JSDOM } = require('jsdom');
const scrapers = require('../../../server/venues');

module.exports = async () => {
	console.log("Start Updating event details");
	const events = await getEvents();
	const queries = [];
	for (const event of events) {
		if (event.link.length) {
			console.log(`Scraping ${event.link}`)
			try {
				const pageHTMLAsText = await fetch(event.link)
					.then(response => response.text());
				const { document } = new JSDOM(pageHTMLAsText).window;
				const scraper = scrapers[event.venue];
				const detailedEvent = scraper ? { ...event, ...scraper.getEventDetails(document) } : event;
				const {
					date,
					title,
					image_url,
					time,
					cost,
					description,
					link
				} = detailedEvent;
				const dateQuery = date ? `date = '${date}'` : '';
				const titleQuery = title ? `, title = '${title.replace(/'/g, "")}'` : '';
				const imageUrlQuery = image_url ? `, image_url = '${image_url}'` : '';
				const timeQuery = time ? `, time = '${time}'` : '';
				const costQuery = cost ? `, cost = '${cost}'` : '';
				const descriptionQuery = description ? `, description = '${description.replace(/'/g, "")}'` : '';
				queries.push(`UPDATE events SET ${dateQuery} ${titleQuery} ${imageUrlQuery} ${timeQuery} ${costQuery} ${descriptionQuery} WHERE link = '${link}'`);

			} catch (err) {
				console.log(err);
			}
		}

	}

	try {
		console.log(`Updating ${queries.length} events into DB`);
		for (const query of queries) {
			await pool.query(query);
		}
	} catch (err) {
		throw err;
	}
};