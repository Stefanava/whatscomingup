module.exports = (document) => {
	let listItems = document.querySelector('#whatson').querySelectorAll('li');;
	
	listItems = Array.from(listItems).map(li => {
		const dateString = li.querySelector('span').innerHTML.trim();
		const halfDateString = dateString.split("~")[1];
		const [day, month, year] = halfDateString.substr(1, halfDateString.length-4).split("/");
		const date = new Date(year, month - 1, day);
		return {
			date,
			image: li.querySelector('a').outerHTML,
			title: li.querySelector('h2').querySelector('a').innerHTML
		};
	});
	return listItems;
}