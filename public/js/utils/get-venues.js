const fetch = require('node-fetch');
module.exports = async ({
	active='TRUE',
}) => {
	const venues = await fetch(`${process.env.APP_BASE_URL}/get-venues`, {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			active
		})
	}).then((data) => data.json());
	return venues;
};