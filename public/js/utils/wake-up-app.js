const fetch = require('node-fetch');
module.exports = async () => {
	let events = await fetch(`${process.env.APP_BASE_URL}/`, {
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
	});
};