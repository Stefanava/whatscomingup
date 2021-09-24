module.exports = (document) => {
	let eventThumbnails = document.querySelectorAll('.events__event-thumbnail');
	// The first events will start this month
	const today = new Date();
	let month = today.getMonth() + 1;
	let year = today.getFullYear();
	eventThumbnails = Array.from(eventThumbnails).map((event, index) => {
		const aNode = event.querySelector('a');
		const image = `<a target="_blank" href=${aNode.getAttribute("href")}><img src="${aNode.style['background-image'].substring(4)}"></img><a/>`;
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
			image_url: aNode.style['background-image'].substring(4),
			link: aNode.getAttribute("href"),
			title: event.querySelector('.event-thumbnail__title').innerHTML
		};
	});
	return eventThumbnails;
}