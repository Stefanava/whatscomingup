const HealthCheck = require('@financial-times/health-check');
const fetch = require('node-fetch');

const opts = {
	method: 'GET'
};

class UsageReporterHealthCheck extends HealthCheck.Check{
	async run () {
		try {
			const response = await fetch('http://ip-usage-reporter.herokuapp.com/__health', opts);
			if (response.status !== 200) {
				throw new Error('Unable to access IP Usage Reporter');
			}

			if (response.status === 200) {
				this.ok = true;
				this.checkOutput = 'OK';
				// read the body so it can be garbage collected
				response.text();
			}
		}
		catch(error) {
			this.log.error({ event: 'IP_USAGE_REPORTER_UNREACHABLE', error: error.toString() });
			this.ok = false;
			this.checkOutput = error.toString();
		} 
		finally {
			this.lastUpdated = new Date();
		}
	}
}

module.exports = UsageReporterHealthCheck;
