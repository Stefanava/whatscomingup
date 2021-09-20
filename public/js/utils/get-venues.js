module.exports = async () => {
	const venues = await fetch(`${process.env.APP_BASE_URL}/get-venues`, {
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
	}).then((data) => data.json());
	return venues;
};