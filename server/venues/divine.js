const getEventDetails = (document) => {
	let wpb_wrapper = document.querySelectorAll('.wpb_content_element > .wpb_wrapper');
	const timeEl = wpb_wrapper[1]?.querySelector('h3');
	return timeEl ? { time: timeEl.innerHTML.replace('Time: ', '') } : {};
};

const getAllEvents = (document) => {
	const listItems = document.querySelectorAll('ul.products li.product');
	return Array.from(listItems).map(li => {
		const link = li.querySelector('a').getAttribute('href');
		const image_url = li.querySelector('img')?.getAttribute('src') || '';
		const h2 = li.querySelector('h2');
		const dateString = h2.querySelector('span').innerHTML.trim();
		const halfDateString = dateString.split('~')[1];
		const [day, month, year] = halfDateString.substr(1, halfDateString.length - 4).split('/');
		const date = new Date(year, month - 1, day);
		const title = h2.querySelector('a')?.innerHTML || '';
		return { date, image_url, link, title };
	});
};

module.exports = { getAllEvents, getEventDetails };
