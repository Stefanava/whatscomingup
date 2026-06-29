const getEventDetails = () => ({});

const getAllEvents = () => {
	throw new Error('Lightbox uses a Skiddle JavaScript widget — events cannot be scraped via HTML');
};

module.exports = { getAllEvents, getEventDetails };
