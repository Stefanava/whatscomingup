const mysql = require('mysql');
const fetch = require('node-fetch');
const getEvents = require('./get-events');
const { JSDOM } = require('jsdom');
const glory = require('../../../server/venues/glory');
const rvt = require('../../../server/venues/rvt');
const dalstonSuperstore = require('../../../server/venues/dalston-superstore');
const fire = require('../../../server/venues/fire');
const lightbox = require('../../../server/venues/lightbox');
const twoBrewers = require('../../../server/venues/two-brewers');
const heaven = require('../../../server/venues/heaven');
const xoyo = require('../../../server/venues/xoyo');
const bgwmc = require('../../../server/venues/bgwmc');

module.exports = async () => {
	console.log("Start Updating event details")
	const events = await getEvents();
	const queries = [];
	for(const event of events) {
		if(event.link.length) {
			console.log(`Scraping ${event.link}`)
			const pageHTMLAsText = await fetch(event.link)
				.then(response => response.text());
			const { document } = new JSDOM(pageHTMLAsText).window;
			let detailedEvent;
			// Dynamic paths for require would be a pretty nifty way of removing this switch statement
			switch(event.venue_id) {
				case 1:
					detailedEvent = {
						...event,
						...glory.getEventDetails(document)
					};
					break;
				case 2:
					detailedEvent = {
						...event,
						...rvt.getEventDetails(document)
					};
					break;
				case 3:
					detailedEvent = {
						...event,
						...dalstonSuperstore.getEventDetails(document)
					};
					break;
				case 4:
					detailedEvent = {
						...event,
						...fire.getEventDetails(document)
					};
					break;
				case 5:
					detailedEvent = {
						...event,
						...lightbox.getEventDetails(document)
					};
					break;
				case 6:
					detailedEvent = {
						...event,
						...twoBrewers.getEventDetails(document)
					};
					break;
				case 7:
					detailedEvent = {
						...event,
						...heaven.getEventDetails(document)
					};
					break;
				case 8:
					detailedEvent = {
						...event,
						...xoyo.getEventDetails(document)
					};
					break;
				case 9:
					detailedEvent = {
						...event,
						...bgwmc.getEventDetails(document)
					};
					break;
			}
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
		}

	}

	try {
		const connection = mysql.createConnection(process.env.JAWSDB_URL);
		connection.connect();
		
		console.log(`Updating ${queries.length} events into DB`);
		
		queries.forEach((query, index) => {
			connection.query(query, function(err, rows, fields) {
				if (err) throw err;
				console.log(`Successfully updated event ${index+1}/${queries.length} into DB`);
				return rows;
			});
		});
		connection.end();
	} catch (err) {
		throw err;
	}
};