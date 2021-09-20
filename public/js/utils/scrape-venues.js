const mysql = require('mysql');
const getVenues = require('./get-venues');
const bgwmc = require('./../../../server/venues/bgwmc');
const dalstonSuperstore = require('./../../../server/venues/dalston-superstore');
const fire = require('./../../../server/venues/fire');
const glory = require('./../../../server/venues/glory');
const heaven = require('./../../../server/venues/heaven');
const lightbox = require('./../../../server/venues/lightbox');
const rvt = require('./../../../server/venues/rvt');
const twoBrewers = require('./../../../server/venues/two-brewers');
const xoyo = require('./../../../server/venues/xoyo');
const { time } = require('console');

const {
	'bgwmc': bgwmc,
	'dalston-superstore': dalstonSuperstore,
	'fire': fire,
	'glory': glory,
	'heaven': heaven,
	'lightbox': lighhtbox,
	'rvt': rvt,
	'two-brewers': twoBrewers,
	'xoyo': xoyo
} = eventProcessingObj;

module.exports = () => {
	const venues = await getVenues();
	venues.forEach(venue => {
		try {
			const { venue_url, id } = venue;
			const pageHTMLAsText = await fetch(venue_url)
				.then((response) => response.text());
			const { document } = new JSDOM(pageHTMLAsText).window;
			const events = eventProcessingObj[venue.slug](document);
			console.log(events);

			const connection = mysql.createConnection(process.env.JAWSDB_URL);
			connection.connect();
			const query = 'INSERT INTO events (date, title, image_url, time, cost, description, venue_id) VALUES ';
			events.forEach(event => {
				const {
					date,
					title,
					image_url,
					time,
					cost,
					description,
				} = event;
				query += `(${date}, ${title}, ${image_url}, ${time}, ${cost}, ${description}, ${id})`;
			});
			connection.query(query, function(err, rows, fields) {
				if (err) throw err;
				res.json(rows);
			});
			connection.end();

		} catch(err) {
			console.log(err);
			res.send([]);
		}
	});
};