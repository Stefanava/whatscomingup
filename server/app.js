require('@babel/polyfill');
const express = require('express')
const app = express();
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
require('dotenv').config();
const cors = require('cors')
const getHealthChecks = require('../server/controllers/get-healthchecks');
const { JSDOM } = require('jsdom');
const glory = require('./venues/glory');
const rvt = require('./venues/rvt');
const dalstonSuperstore = require('./venues/dalston-superstore');
const fire = require('./venues/fire');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('dist'));

app.get('/__gtg', (req, res) => {
	res.send('Good to go');
  });

app.get('/__health', getHealthChecks);  

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

module.exports = app;
