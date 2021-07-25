require('@babel/polyfill');
const express = require('express')
const app = express();
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
require('dotenv').config();
const cors = require('cors')
const getHealthChecks = require('../server/controllers/get-healthchecks');
const { JSDOM } = require('jsdom');
const moment = require('moment');

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
		
		const list = document.querySelector('#whatson').innerHTML;
		let listItems = new JSDOM(list).window.document.querySelectorAll('li');
		
		listItems = Array.from(listItems).map(li => {
			const dateString = li.querySelector('span').innerHTML.trim();
			const halfDateString = dateString.split("~")[1];
			const [day, month, year] = halfDateString.substr(1, halfDateString.length-4).split("/");
			const date = new Date(year, month - 1, day);
			return {
				date,
				image: li.querySelector('a').outerHTML,
				title: li.querySelector('h2').querySelector('a').innerHTML
			};
		});
		
		res.send(listItems);
	} catch(err) {
		console.log(err);
	}
});

app.get('/rvt', cors(), async (req, res) => {
	try {
		const pageHTMLAsText = await fetch(`${process.env.RVT_URL}`)
			.then((response) => response.text());

		const { document } = new JSDOM(pageHTMLAsText).window;

		const months = document.querySelector('#month').querySelectorAll('.month');
		let allBoxes = [];
		Array.from(months).forEach(month => {
			const boxes = month.querySelectorAll('.box');
			Array.from(boxes).forEach(box => {
				allBoxes.push(box);
			});
		})


		allBoxes = allBoxes.map(box => {
			const dateString = box.querySelector('.post-date').getAttribute('datetime');
			const eventTime = box.querySelector('.post-time').innerHTML;
			const postThumbNode = box.querySelector('.post-thumb')
			const imgNode = postThumbNode.querySelector('img');
			const aNode = document.createElement('a');
			aNode.setAttribute("href", box.querySelector('a'));
			aNode.appendChild(imgNode);
			return {
				date: new Date(dateString),
				image: aNode.outerHTML,
				title: box.querySelector('.post-title').querySelector('span').innerHTML,
				time: eventTime
			};
		});

		res.send(allBoxes);
	} catch(err) {
		console.log(err);
	}
});

app.get('/dalston-superstore', cors(), async (req, res) => {
	try {
		const pageHTMLAsText = await fetch(`${process.env.DALSTON_SUPERSTORE_URL}`)
			.then((response) => response.text());

		// console.log(pageHTMLAsText)

		const { document } = new JSDOM(pageHTMLAsText).window;

		let eventThumbnails = document.querySelectorAll('.events__event-thumbnail');
		// The first events will start this month
		const today = new Date();
		let month = today.getMonth() + 1;
		let year = today.getFullYear();
		eventThumbnails = Array.from(eventThumbnails).map((event, index) => {
			const aNode = event.querySelector('a');
			const image = `<a href=${aNode.getAttribute("href")}><img src="${aNode.style['background-image'].substring(4)}"></img><a/>`;
			const day = event.querySelector('.events__event-thumbnail__date').innerHTML;
			if (day < Array.from(eventThumbnails)[index - 1]) {
				month += 1;
			}
			if(month === 13) {
				year += 1;
			}

			return {
				date: new Date(year, month - 1, day),
				image,
				title: event.querySelector('.event-thumbnail__title').innerHTML
			};
		});
		res.send(eventThumbnails);
	} catch(err) {
		console.log(err);
	}
});

module.exports = app;
