module.exports = async () => {
	let events = await fetch(`/get-events`, {
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
	}).then((data) => data.json());
	return events;
};