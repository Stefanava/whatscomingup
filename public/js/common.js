require('dotenv').config();
require('@babel/polyfill');

const showWhatsappninButton = document.getElementById('show-whatsappnin');
const whatsappninPanel = document.getElementById('whatsappnin-panel');


document.addEventListener("DOMContentLoaded", () => {
    showWhatsappninButton.addEventListener('click', () => {
        whatsappninPanel.style.display = "block";
    });
});
