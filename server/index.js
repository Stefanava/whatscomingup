require('dotenv').config();
const app = require('./app');
const port = process.env.PORT || 1234;

app.listen(port, '0.0.0.0', () => {
	console.log(`Running on 0.0.0.0:${port}`);
});