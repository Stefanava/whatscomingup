require('@babel/polyfill');
const express = require('express')
const app = express();
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
require('dotenv').config();
const cors = require('cors')
const mysql = require('mysql');
const { JSDOM } = require('jsdom');
const glory = require('./venues/glory');
const rvt = require('./venues/rvt');
const dalstonSuperstore = require('./venues/dalston-superstore');
const fire = require('./venues/fire');
const lightbox = require('./venues/lightbox');
const twoBrewers = require('./venues/two-brewers');
const heaven = require('./venues/heaven');
const xoyo = require('./venues/xoyo');
const bgwmc = require('./venues/bgwmc');

app.use(express.static('dist'));

app.get('/__gtg', (req, res) => {
	res.send('Good to go');
  });

app.get('/get-venues', cors(), async (req, res) => {
	try {
		const connection = mysql.createConnection(process.env.JAWSDB_URL);
		connection.connect();
		connection.query(`SELECT * from venues`, function(err, rows, fields) {
			if (err) throw err;
			res.json(rows);
		});
		connection.end();
	} catch(err) {
		console.log(err);
		res.send([]);
	}
});

app.get('/get-events', cors(), async (req, res) => {
	try {
		const connection = mysql.createConnection(process.env.JAWSDB_URL);
		connection.connect();
		connection.query(`SELECT * from events`, function(err, rows, fields) {
			if (err) throw err;
			res.json(rows);
		});
		connection.end();
	} catch(err) {
		console.log(err);
		res.send([]);
	}
});

app.get('/glory', cors(), async (req, res) => {
	try {
		const pageHTMLAsText = await fetch(`${process.env.GLORY_URL}`)
			.then((response) => response.text());
		const { document } = new JSDOM(pageHTMLAsText).window;
		const response = glory(document);
		res.send(response);
	} catch(err) {
		console.log(err);
		res.send([]);
	}
});

app.get('/rvt', cors(), async (req, res) => {
	try {
		const pageHTMLAsText = await fetch(`${process.env.RVT_URL}`)
			.then((response) => response.text());

		const { document } = new JSDOM(pageHTMLAsText).window;
		const response = rvt(document);
		res.send(response);
	} catch(err) {
		console.log(err);
		res.send([]);
	}
});

app.get('/dalston-superstore', cors(), async (req, res) => {
	try {
		const pageHTMLAsText = await fetch(`${process.env.DALSTON_SUPERSTORE_URL}`)
			.then((response) => response.text());

		const { document } = new JSDOM(pageHTMLAsText).window;
		const response = dalstonSuperstore(document);
		res.send(response);
	} catch(err) {
		console.log(err);
		res.send([]);
	}
});

app.get('/fire', cors(), async (req, res) => {
	try {
		const pageHTMLAsText = await fetch(`${process.env.FIRE_URL}`)
			.then((response) => response.text());

		const { document } = new JSDOM(pageHTMLAsText).window;
		const response = fire(document);
		res.send(response);
	} catch(err) {
		console.log(err);
		res.send([]);
	}
});

app.get('/lightbox', cors(), async (req, res) => {
	try {
		const pageHTMLAsText = await fetch(`${process.env.LIGHTBOX_URL}`)
			.then((response) => response.text());

		const { document } = new JSDOM(pageHTMLAsText).window;
		const response = lightbox(document);
		res.send(response);
	} catch(err) {
		console.log(err);
		res.send([]);
	}
});

app.get('/two-brewers', cors(), async (req, res) => {
	try {
		const pageHTMLAsText = await fetch(`${process.env.TWO_BREWERS_URL}`)
			.then((response) => response.text());

		const { document } = new JSDOM(pageHTMLAsText).window;
		const response = twoBrewers(document);
		res.send(response);
	} catch(err) {
		console.log(err);
		res.send([]);
	}
});

app.get('/heaven', cors(), async (req, res) => {
	try {
		const pageHTMLAsText = await fetch(`${process.env.HEAVEN_URL}`)
			.then((response) => response.text());

		const { document } = new JSDOM(pageHTMLAsText).window;
		const response = heaven(document);
		res.send(response);
	} catch(err) {
		console.log(err);
		res.send([]);
	}
});

app.get('/xoyo', cors(), async (req, res) => {
	try {
		const pageHTMLAsText = await fetch(`${process.env.XOYO_URL}`)
			.then((response) => response.text());

		const { document } = new JSDOM(pageHTMLAsText).window;
		const response = xoyo(document);
		res.send(response);
	} catch(err) {
		console.log(err);
		res.send([]);
	}
});

app.get('/bgwmc', cors(), async (req, res) => {
	try {
		const pageHTMLAsText = await fetch(`${process.env.BGWMC_URL}`)
			.then((response) => response.text());

		const { document } = new JSDOM(pageHTMLAsText).window;
		const response = bgwmc(document);
		res.send(response);
	} catch(err) {
		console.log(err);
		res.send([]);
	}
});

module.exports = app;
