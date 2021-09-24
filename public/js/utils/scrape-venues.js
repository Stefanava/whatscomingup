const fetch = require('node-fetch');
const mysql = require('mysql');
const getVenues = require('./get-venues');

module.exports = async () => {
	console.log("Start scraping venues");
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

			let query = `INSERT INTO events (date, title, image_url, time, cost, description, venue_id, link) VALUES `;
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
				query += `('${date || ''}', '${title ? title.replace(/'/g, "") : ''}', '${image_url || ''}', '${time || ''}', '${cost || ''}', '${description ? description.replace(/'/g, "") : ''}', '${id}', '${link}'), `;
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