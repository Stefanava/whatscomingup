require('dotenv').config();
module.exports = async () => {
	let events = await fetch(`${process.env.APP_BASE_URL}/get-events`, {
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
	}).then((data) => data.json());
	return events;
};