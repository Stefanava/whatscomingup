
const getEventDetails = () => {
	return {};
};

const getAllEvents = (document) => {
	const months = document.querySelector('#month').querySelectorAll('.month');
	let allBoxes = [];
	Array.from(months).forEach(month => {
		const boxes = month.querySelectorAll('.box');
		Array.from(boxes).forEach(box => {
			allBoxes.push(box);
		});
	});

	allBoxes = allBoxes.map(box => {
		const dateString = box.querySelector('.post-date').getAttribute('datetime');
		const eventTime = box.querySelector('.post-time').innerHTML;
		const link = box.querySelector('a').getAttribute('href');
		const image_url = box.querySelector('img').getAttribute('src');

		// date, title, image_url, time, cost, description, venue_id, link
		return {
			date: new Date(dateString),
			image_url,
			link,
			title: box.querySelector('.post-title').querySelector('span').innerHTML,
			time: eventTime
		};
	});

	return(allBoxes);
}

module.exports = {
	getAllEvents,
	getEventDetails
}