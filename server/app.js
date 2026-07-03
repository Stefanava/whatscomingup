require('dotenv').config();
const express = require('express')
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors')
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const passport = require('./passport');
const pool = require('../public/js/utils/db');
const { JSDOM } = require('jsdom');
const scrapers = require('./venues');
const scrapeVenues = require('../public/js/utils/scrape-venues');
const updateEventDetails = require('../public/js/utils/update-event-details');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
	store: new PgSession({ pool, createTableIfMissing: true }),
	secret: process.env.SESSION_SECRET || 'nin-dev-secret',
	resave: false,
	saveUninitialized: false,
	cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());

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

const DEDUP_SQL = `
	DELETE FROM events a
	USING events b
	WHERE a.ctid > b.ctid
	  AND a.title = b.title
	  AND a.date = b.date
`;

app.get('/refresh-events', cors(), async (req, res) => {
	try {
		const { rows: existing } = await pool.query(
			"SELECT link FROM events WHERE date > NOW()"
		);
		const existingLinks = new Set(existing.map(r => r.link));

		const { rows: venues } = await pool.query("SELECT * FROM venues WHERE active = 'TRUE'");
		const results = [];

		for (const venue of venues) {
			const { slug, name, url } = venue;
			const result = { name, eventsInserted: 0, error: null };
			const scraper = scrapers[slug];

			if (!scraper) { result.error = 'No scraper found'; results.push(result); continue; }
			if (!scraper.fetchEvents && !url) { result.error = 'No URL set'; results.push(result); continue; }

			try {
				let events;
				if (scraper.fetchEvents) {
					events = await scraper.fetchEvents();
				} else {
					const pageHTMLAsText = await fetch(url).then(r => r.text());
					const { document } = new JSDOM(pageHTMLAsText).window;
					events = scraper.getAllEvents(document);
				}

				const moment = require('moment');
				const valueParts = [];
				events.forEach(event => {
					const { date, title, image_url, time, cost, description, link } = event;
					if (!existingLinks.has(link) && moment(new Date(date)).isAfter(moment(new Date()), 'day')) {
						valueParts.push(`('${date ? moment(new Date(date)).toISOString() : ''}', '${title ? title.replace(/'/g, "") : ''}', '${image_url || ''}', '${time || ''}', ${cost ? `'${cost}'` : 'NULL'}, '${description ? description.replace(/'/g, "") : ''}', '${link}', '${slug}')`);
					}
				});

				if (valueParts.length) {
					await pool.query(`INSERT INTO events (date, title, image_url, time, cost, description, link, venue) VALUES ${valueParts.join(', ')}`);
				}
				result.eventsInserted = valueParts.length;
			} catch (err) {
				console.log(`Error refreshing ${slug}:`, err.message);
				result.error = err.message;
			}

			results.push(result);
		}

		await pool.query(DEDUP_SQL);

		const rows = results.map(({ name, eventsInserted, error }) => {
			const status = error ? `❌ ${error}` : `✅ ${eventsInserted} new event${eventsInserted !== 1 ? 's' : ''}`;
			return `<tr><td>${name}</td><td>${status}</td></tr>`;
		}).join('');
		res.send(`<h1>Refresh complete</h1><table border="1" cellpadding="6"><tr><th>Venue</th><th>Result</th></tr>${rows}</table>`);
	} catch (err) {
		console.log(err);
		res.send(`<h1>Refresh failed</h1><pre>${err.message}</pre>`);
	}
});

// ── auth ──────────────────────────────────────────────────────────────────────

app.get('/auth/me', cors(), async (req, res) => {
	const authAvailable = !!process.env.GOOGLE_CLIENT_ID;
	if (!req.user) return res.json({ user: null, authAvailable });
	try {
		const { rows } = await pool.query(
			'SELECT venue_slug FROM user_favourites WHERE user_id = $1',
			[req.user.id]
		);
		res.json({ user: req.user, favourites: rows.map(r => r.venue_slug), authAvailable });
	} catch (_) {
		res.json({ user: req.user, favourites: [], authAvailable });
	}
});

app.post('/auth/favourites', cors(), async (req, res) => {
	if (!req.user) return res.status(401).json({ error: 'Not logged in' });
	const { venues } = req.body;
	if (!Array.isArray(venues)) return res.status(400).json({ error: 'venues must be an array' });
	try {
		await pool.query('DELETE FROM user_favourites WHERE user_id = $1', [req.user.id]);
		if (venues.length) {
			const values = venues.map((_, i) => `($1, $${i + 2})`).join(', ');
			await pool.query(
				`INSERT INTO user_favourites (user_id, venue_slug) VALUES ${values}`,
				[req.user.id, ...venues]
			);
		}
		res.json({ ok: true });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

if (process.env.GOOGLE_CLIENT_ID) {
	app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

	app.get('/auth/google/callback',
		passport.authenticate('google', { failureRedirect: '/' }),
		(req, res) => res.redirect('/?loggedIn=1')
	);
}

app.get('/auth/logout', (req, res, next) => {
	req.logout(err => {
		if (err) return next(err);
		res.redirect('/');
	});
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