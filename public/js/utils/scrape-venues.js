const fetch = require('node-fetch');
const mysql = require('mysql');
const { JSDOM } = require('jsdom');
const getVenues = require('./get-venues');
const bgwmc = require('./../../../server/venues/bgwmc');
const dalstonSuperstore = require('./../../../server/venues/dalston-superstore');
const fire = require('./../../../server/venues/fire');
const { glory } = require('./../../../server/venues/glory');
const heaven = require('./../../../server/venues/heaven');
const lightbox = require('./../../../server/venues/lightbox');
const rvt = require('./../../../server/venues/rvt');
const twoBrewers = require('./../../../server/venues/two-brewers');
const xoyo = require('./../../../server/venues/xoyo');

module.exports = async () => {
	const eventProcessingObj = {
		'bgwmc': bgwmc,
		'dalston-superstore': dalstonSuperstore,
		'fire': fire,
		'glory': glory,
		'heaven': heaven,
		'lightbox': lightbox,
		'rvt': rvt,
		'two-brewers': twoBrewers,
		'xoyo': xoyo
	} ;

	const venues = await getVenues({});
	const queries = [];
	const connection = mysql.createConnection(process.env.JAWSDB_URL);
	connection.connect();
	for (const venue of venues) {
		try {
			const { id, slug } = venue;
			const events = await fetch(`${process.env.APP_BASE_URL}/${slug}`, {
				method: 'GET',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				}
			}).then((response) => response.json());
			console.log(`Found ${events.length} events at ${slug}`);

			let query = `INSERT INTO events (date, title, image, image_url, time, cost, description, venue_id) VALUES `;
			events.forEach(event => {
				const {
					date,
					title,
					image,
					image_url,
					time,
					cost,
					description,
				} = event;
				query += `('${date || ''}', '${title ? title.replace(/'/g, "") : ''}', '${image || ''}', '${image_url || ''}', '${time || ''}', '${cost || ''}', '${description ? description.replace(/'/g, "") : ''}', '${id}'), `;
			});
			query = query.substring(0, query.length - 2);
			queries.push(query);
		} catch(err) {
			console.log(err);
			throw err;
		}
	};
	try {
		connection.query(`TRUNCATE TABLE events`, function(err, rows, fields) {
			if (err) throw err;
			console.log("Successfully inserted events into DB");
			return rows;
		});
		queries.forEach((query, index ) => {
			console.log(`Executing insert query ${index}`);
			console.log(query);
			connection.query(query, function(err, rows, fields) {
				if (err) throw err;
				console.log("Successfully inserted events into DB");
				return rows;
			});
		});
		connection.end();
	} catch (err) {
		throw err;
	}
};