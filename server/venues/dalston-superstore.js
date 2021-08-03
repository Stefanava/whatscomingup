module.exports = (document) => {
	let eventThumbnails = document.querySelectorAll('.events__event-thumbnail');
	// The first events will start this month
	const today = new Date();
	let month = today.getMonth() + 1;
	let year = today.getFullYear();
	eventThumbnails = Array.from(eventThumbnails).map((event, index) => {
		const aNode = event.querySelector('a');
		const image = `<a href=${aNode.getAttribute("href")}><img src="${aNode.style['background-image'].substring(4)}"></img><a/>`;
		const day = event.querySelector('.events__event-thumbnail__date').innerHTML;
		if (day < Array.from(eventThumbnails)[index - 1]) {
			month += 1;
		}
		if(month === 13) {
			year += 1;
		}

		return {
			date: new Date(year, month - 1, day),
			image,
			title: event.querySelector('.event-thumbnail__title').innerHTML
		};
	});
	return eventThumbnails;
}