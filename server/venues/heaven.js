const getEventDetails = (document) => {
	return {};
};

const getAllEvents = (document) => {
	let cards = document.querySelectorAll('.event-card');

	cards = Array.from(cards).map(card => {
		const imageAddress = card.querySelector('.d-img').getAttribute('data-url');
		const aNode = card.querySelector('header').querySelector('a');
		const link = aNode.getAttribute('href');
		
		const eventDetails = card.querySelector('.event-details');
		const date = eventDetails.querySelector('.datetime').getAttribute('content');
		let title = eventDetails.querySelector('.title').innerHTML;
		const support = eventDetails.querySelector('.support').innerHTML;
		title = `${title} ${support}`;

		// date, title, image_url, time, cost, description, venue_id, link
		return {
			date: new Date(date),
			image_url: imageAddress,
			title: title,
			link,
			time: new Date(date).toLocaleTimeString(),
		};
	});

	return(cards);
};

module.exports = {
	getAllEvents,
	getEventDetails
}