require('dotenv').config();
require('@babel/polyfill');
const fetch = require('node-fetch');
const moment = require('moment');

const venues = require('../../constants/venues');
// Create a list of venues at the top of the page
const venueListDiv = document.getElementById('venue-list');
for(const venueKey in venues) {
    const { venueDisplayName } = venues[venueKey];
    const span = document.createElement('span');
    span.id = `venue-list-item-${venueKey}`;
    span.className = 'venue-list-item';
    span.innerHTML = `${venueDisplayName}`;
    venueListDiv.appendChild(span);
}

const eventGridContainer = document.getElementById('event-grid-container');

const upcomingDays = [];

for(let i=0;i<1000;i++) {
    let date = new Date();
    date.setDate(date.getDate() + i);
    upcomingDays.push(date);
}

// Generate the event containers by date
upcomingDays.forEach(date => {
    const dayGrid = `<div class="event-container" id="event-container-date-${date.toDateString().split(' ').join("-")}"><h2>${moment(date).format('dddd Do MMMM')}</h2></div>`;
    eventGridContainer.innerHTML = eventGridContainer.innerHTML + dayGrid;
});

const whatsappnin = async () => {
    try {
        for(const venueKey in venues) {
            const { borderColor, slug, venueDisplayName } = venues[venueKey];
            const venueListItem = document.getElementById(`venue-list-item-${venueKey}`);
            // This indicates that the venue's events are loading
            venueListItem.style.color = 'orange';
            const events =  await fetch(`${process.env.APP_BASE_URL}/${slug}`, {
                    method: 'GET',
                    headers: { 
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                }).then((data) => data.json());
            
            // This indicates that the venue's events have loaded
            venueListItem.style.color = 'green';
    
            // Just adding them into the array in case I need them somewhere in future
            venues[venueKey].events = events;
    
            events.forEach(({image, date, time, title}) => {
                let eventString = `<div class="event-grid-item" style="border: 3px solid ${borderColor}">
                                    <div class="event-title">${venueDisplayName}: ${title} ${time ? `(${time})` : ''}</div>
                                    <br>
                                    <div class="event-image">${image}</div>
                                    </div>`;
                const dayGrid = document.querySelector(`#event-container-date-${new Date(date).toDateString().split(' ').join("-")}`);
                if(dayGrid) dayGrid.innerHTML = dayGrid.innerHTML + eventString;
            });
        }
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


whatsappnin();


module.exports = whatsappnin;