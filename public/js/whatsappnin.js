require('dotenv').config();
require('@babel/polyfill');
const moment = require('moment');
const getVenues = require('./utils/get-venues');
const getEvents = require('./utils/get-events');

const eventGridContainer = document.getElementById('event-grid-container');
const venueListDiv = document.getElementById('venue-list');
        
const upcomingDays = [];

for (let i = 0; i < 1000; i++) {
    let date = new Date();
    date.setDate(date.getDate() + i);
    upcomingDays.push(date);
}

// Generate the event containers by date
upcomingDays.forEach(date => {
    const dayGrid = `<div class="event-container" id="event-container-date-${date.toDateString().split(' ').join("-")}"><h2>${moment(date).format('dddd Do MMMM')}</h2></div>`;
    eventGridContainer.innerHTML = eventGridContainer.innerHTML + dayGrid;
});

const run = async () => {
    try {
        const allVenues = await getVenues({});
        const allEvents = await getEvents();
        console.log(allEvents);

        const venues = allVenues.map(venue => {
            return { 
                events: allEvents.filter(({ venue_id }) => venue_id === venue.id),
                ...venue
            };
        });

        // Build the venues object adding the events
        venues.forEach(venue => {
            
            // Create a list of venues at the top of the page
            const { color, name, slug } = venue;
            const span = document.createElement('span');
            span.id = `venue-list-item-${slug}`;
            span.className = 'venue-list-item';
            span.innerHTML = `${name}`;
            span.style.color = color;
            venueListDiv.appendChild(span);

            venue.events.forEach(({ description, image, date, time, title }) => {
                let eventString = `<div class="event-grid-item" style="background: ${color}">
                                    <div class="event-title">${name}: ${title} ${time ? `(${time})` : ''}</div>
                                    <div class="event-description"><em>${description || ''}</em></div>
                                    <br>
                                    <div class="event-image">${image}</div>
                                    </div>`;
                const dayGrid = document.querySelector(`#event-container-date-${new Date(date).toDateString().split(' ').join("-")}`);
                if (dayGrid) dayGrid.innerHTML = dayGrid.innerHTML + eventString;
            });
        });

        // Once all venues and events added, hide the events containers with no events
        const eventContainers = document.getElementsByClassName('event-container');
        Array.from(eventContainers).forEach(container => {
            if(!container.querySelector('div')) {
                container.style.display = 'none';
            }
        });
    } catch (error) {
        console.log(error);
    }
}


run();
