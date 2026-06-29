const getEventDetails = () => ({});

const getAllEvents = (document) => {
	const blocks = document.querySelectorAll('.event-block');
	const now = new Date();
	const currentYear = now.getFullYear();

	return Array.from(blocks).map(block => {
		const link = 'https://www.xoyo.co.uk' + block.querySelector('a').getAttribute('href');
		const image_url = block.querySelector('.event-image').style.backgroundImage
			.replace(/url\(["']?(.+?)["']?\)/, '$1');
		const dateTexts = block.querySelectorAll('.date-block h4');
		const dateStr = dateTexts[1]?.innerHTML?.trim() || '';
		const parsedDate = new Date(`${dateStr} ${currentYear}`);
		const date = parsedDate < now ? new Date(`${dateStr} ${currentYear + 1}`) : parsedDate;
		const title = block.querySelector('.event-title-holder h2')?.innerHTML?.trim() || '';

		return { date, image_url, link, title };
	});
};

module.exports = { getAllEvents, getEventDetails };
