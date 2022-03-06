const getEventDetails = (document) => {
	return {
		time: document.querySelector('[data-hook=event-full-date]').innerHTML
	};
};

const getAllEvents = (document) => {
	let eventHolders = document.querySelectorAll('[data-hook=events-card]');

	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	eventHolders = Array.from(eventHolders).map(eventHolder => {
		const title = eventHolder.querySelector('[data-hook=image]').getAttribute('alt');
		const imageLink = eventHolder.querySelector('[data-hook=image]').getAttribute('src');
		const link = eventHolder.querySelector('[data-hook=title]').querySelector('a').getAttribute('href');

		let [blank, dayString, month] = eventHolder.querySelector('[data-hook=short-date]').innerHTML.split(',')[1].split(' '); // 08 Dec

		// const rawDate = eventHolder.querySelector('[data-hook=short-date]').innerHTML; // Wed, 08 Dec

		month = months.indexOf(month) + 1;

		if(month.toString().length === 1) month = `0${month}`;
		const dateString = `${month}-${dayString}-${new Date().getFullYear()}`;

		// date, title, image_url, time, cost, description, venue_id, link
		return {
			date: new Date(dateString),
			image_url: imageLink,
			link,
			title
		};
	});

	return eventHolders;
};

module.exports = {
	getAllEvents,
	getEventDetails
}