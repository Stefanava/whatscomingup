const getEventDetails = (document) => {
	const time_from = document.querySelector('.single-event__time__from');
	const time_to = document.querySelector('.single-event__time__to');
	const descriptions = document.querySelector('.tribe-events-list-event-description').childNodes;
	let descString = '';
	Array.from(descriptions).forEach(node => descString += node.innerHTML || '');

	console.log(`${time_from.innerHTML} - ${time_to.innerHTML}`);
	return {
		time: `${time_from.innerHTML} - ${time_to.innerHTML}`,
		description: descString
	};
};

const getAllEvents = (document) => {
	let eventThumbnails = document.querySelectorAll('.events__event-thumbnail');
	// The first events will start this month
	const today = new Date();
	let month = today.getMonth() + 1;
	let year = today.getFullYear();
	eventThumbnails = Array.from(eventThumbnails).map((event, index) => {
		const aNode = event.querySelector('a');
		const day = event.querySelector('.events__event-thumbnail__date').innerHTML;
		if (day < Array.from(eventThumbnails)[index - 1]) {
			month += 1;
		}
		if(month === 13) {
			year += 1;
		}

		// date, title, image_url, time, cost, description, venue_id, link
		return {
			date: new Date(year, month - 1, day),
			image_url: aNode.style['background-image'].slice(4, -1),
			link: aNode.getAttribute("href"),
			title: event.querySelector('.event-thumbnail__title').innerHTML
		};
	});
	return eventThumbnails;
}

module.exports = {
	getAllEvents,
	getEventDetails
}