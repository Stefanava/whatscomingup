const getEventDetails = () => ({});

const getAllEvents = () => {
	throw new Error('Eagle uses Wix — events are JavaScript-rendered and cannot be scraped via HTML');
};

module.exports = { getAllEvents, getEventDetails };
