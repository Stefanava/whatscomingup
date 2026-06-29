const fetch = require('node-fetch');
module.exports = async () => {
	let events = await fetch(`${process.env.APP_BASE_URL}/get-events`, {
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
	}).then((data) => data.json());
	return events.map(event => {
		return {
			...event,
			venue_id: Number(event.venue_id)
		};
	});
};