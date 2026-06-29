require('dotenv').config();
const express = require('express')
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors')
const pool = require('../public/js/utils/db');
const { JSDOM } = require('jsdom');
const scrapers = require('./venues');
const scrapeVenues = require('../public/js/utils/scrape-venues');
const updateEventDetails = require('../public/js/utils/update-event-details');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

app.use(express.static('dist'));

app.get('/__gtg', (req, res) => {
	res.send('Good to go');
});

app.post('/get-venues', cors(), async (req, res) => {
	try {
		const { active } = req.body;
		let query = 'SELECT * FROM venues';
		if (active === 'TRUE') query += " WHERE active = 'TRUE'";
		query += ' ORDER BY name';
		const { rows } = await pool.query(query);
		res.json(rows);
	} catch (err) {
		console.log(err);
		res.send([]);
	}
});

app.get('/get-events', cors(), async (req, res) => {
	try {
		console.log('Get all events');
		const { rows } = await pool.query('SELECT * FROM events');
		console.log('Successfully retrieved all events');
		res.json(rows);
	} catch (err) {
		console.log(err);
		res.send([]);
	}
});

app.get('/scrape-venues', cors(), async (req, res) => {
	try {
		await pool.query('TRUNCATE TABLE events');
		const results = await scrapeVenues();
		const rows = results.map(({ name, eventsInserted, error }) => {
			const status = error ? `❌ ${error}` : `✅ ${eventsInserted} event${eventsInserted !== 1 ? 's' : ''}`;
			return `<tr><td>${name}</td><td>${status}</td></tr>`;
		}).join('');
		res.send(`<h1>Scrape complete</h1><table border="1" cellpadding="6"><tr><th>Venue</th><th>Result</th></tr>${rows}</table>`);
	} catch (err) {
		console.log(err);
		res.send(`<h1>Scrape failed</h1><pre>${err.message}</pre>`);
	}
});

app.get('/update-event-details', cors(), async (req, res) => {
	await updateEventDetails();
	res.send([]);
});

async function getVenueUrl(slug) {
	const { rows } = await pool.query('SELECT url FROM venues WHERE slug = $1', [slug]);
	return rows[0]?.url;
}

async function scrapeVenueRoute(slug, scraper, res) {
	try {
		const url = await getVenueUrl(slug);
		if (!url) throw new Error(`No URL found for venue: ${slug}`);
		const pageHTMLAsText = await fetch(url).then(r => r.text());
		const { document } = new JSDOM(pageHTMLAsText).window;
		res.send(scraper.getAllEvents(document));
	} catch (err) {
		console.log(err);
		res.send([]);
	}
}

Object.entries(scrapers).forEach(([slug, scraper]) => {
	app.get(`/${slug}`, cors(), (req, res) => scrapeVenueRoute(slug, scraper, res));
});

module.exports = app;