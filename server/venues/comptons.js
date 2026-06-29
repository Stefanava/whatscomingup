const { makeGetAllEvents } = require('./designmynight');

const getAllEvents = makeGetAllEvents('https://www.comptonsofsoho.co.uk');
const getEventDetails = () => ({});

module.exports = { getAllEvents, getEventDetails };
