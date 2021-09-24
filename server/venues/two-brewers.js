module.exports = (document) => {
	let events = document.querySelector('.events-inner').querySelectorAll('.event-details');

	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	events = Array.from(events).map(event => {
		const aNode = event.querySelector('a');
		const imageUrl = aNode.querySelector('img').getAttribute('src');
		const link = `${process.env.TWO_BREWERS_URL}${aNode.getAttribute('href')}`;
		const eventInfo = event.querySelector('article').querySelector('.event-info');
		const time = eventInfo.querySelector('.event-time').innerHTML;
		const dayString = eventInfo.querySelector('.day').innerHTML;
		const monthString = eventInfo.querySelector('.month').innerHTML;
		let month = months.indexOf(monthString);

		if(month.toString().length === 1) month = `0${month}`;
		const dateString = `${month}-${dayString}-${new Date().getFullYear()}`;		

		// date, title, image_url, time, cost, description, venue_id, link
		return {
			date: new Date(dateString),
			image_url: imageUrl,
			link: link,
			title: eventInfo.querySelector('.event-title').innerHTML,
			time: time,
		};
	});

	return(events);
}
