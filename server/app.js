require('dotenv').config({ quiet: true });
const express = require('express')
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors')
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const passport = require('./passport');
const pool = require('../public/js/utils/db');

// All venue-specific scraping/extraction logic lives in Supabase Edge
// Functions (supabase/functions/) — this app has no knowledge of how any
// given venue's events are gathered, only how to ask Supabase to do it.
async function callEdgeFunction(name, { searchParams } = {}) {
	const base = process.env.SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!base || !key) throw new Error('SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not configured');

	const url = new URL(`${base}/functions/v1/${name}`);
	if (searchParams) Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));

	const response = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
	if (!response.ok) throw new Error(`Edge function ${name} responded ${response.status}`);
	return response.json();
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
	store: new PgSession({ pool, createTableIfMissing: true }),
	secret: process.env.SESSION_SECRET || 'wcu-dev-secret',
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
		res.json(await callEdgeFunction('refresh-events', { searchParams: { mode: 'full' } }));
	} catch (err) {
		console.log(err);
		res.status(500).json({ error: err.message });
	}
});

app.get('/refresh-events', cors(), async (req, res) => {
	try {
		res.json(await callEdgeFunction('refresh-events'));
	} catch (err) {
		console.log(err);
		res.status(500).json({ error: err.message });
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
	try {
		res.json(await callEdgeFunction('update-event-details'));
	} catch (err) {
		console.log(err);
		res.status(500).json({ error: err.message });
	}
});

app.get('/venue/:slug/preview', cors(), async (req, res) => {
	try {
		res.json(await callEdgeFunction('refresh-events', { searchParams: { slug: req.params.slug } }));
	} catch (err) {
		console.log(err);
		res.status(500).json({ error: err.message });
	}
});

module.exports = app;