// Fetch all AWS accounts
const fetchAllAWSAccounts = async () => {
    try {
        const awsAccounts = await fetch(`${process.env.APP_BASE_URL}/cloudhealth`, {
            method: 'POST',
            headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                query: 'v1/aws_accounts?per_page=100'
            })
        }).then((data) => data.json());
        // Remove FT Tech from the labels
        return awsAccounts.aws_accounts
            .filter(({ amazon_name }) => amazon_name) // Only include accounts with an amazon_name
            .map(a => {
                a.amazon_name = a.amazon_name.replace('FT Tech', '');
                return a;
        });
    } catch (err){
        console.log(err);
    };
};

// Fetch all cost centres
const fetchAllCostCentres = async () => {
    try {
        const costCentreResponse = await fetch(`${process.env.APP_BASE_URL}/cloudhealth`, {
            method: 'POST',
            headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                query: 'v1/perspective_schemas/5360119185440'
            })
        }).then((data) => data.json());
        return costCentreResponse.schema.constants[0].list;
    } catch(err) {
        console.log(err);
    }
};

// Fetch all AWS services
const fetchAllAwsServices = async () => {
    try {
        const awsServicesResponse = await fetch(`${process.env.APP_BASE_URL}/cloudhealth`, {
            method: 'POST',
            headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                query: 'olap_reports/cost/history/new'
            })
        }).then((data) => data.json());
        return awsServicesResponse.dimensions.find(d => d.name === "AWS-Service-Category").members.map(m => m.name);
    } catch(err) {
        console.log(err);
    }
}

// Fetch all system codes
const fetchAllSystemCodes = async () => {
    try {
        const awsSystemCodesResponse = await fetch(`${process.env.APP_BASE_URL}/cloudhealth`, {
            method: 'POST',
            headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                query: 'v1/perspective_schemas/343598156096'
            })
        }).then((data) => data.json());
        return awsSystemCodesResponse.schema.constants.find(c => c.type === "Dynamic Group").list.map(l => ({
            name: l.val.trim().toLowerCase(),
            id: l.ref_id
        }));
    } catch(err) {
        console.log(err);
    }
}

const queryCloudHealth = async ({
    costOrUsage,
    timeInterval,
    dimension,
    filters
}) => {
    try {
        return fetch(`${process.env.APP_BASE_URL}/cloudhealth`, {
            method: 'POST',
            headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: `olap_reports/${costOrUsage}?${timeInterval}&dimensions[]=time&dimensions[]=${dimension}&${filters}`
            })
        }).then((data) => data.json());
    } catch(err) {
        console.log(err);
    }
}

module.exports = {
    fetchAllAWSAccounts,
    fetchAllCostCentres,
    fetchAllAwsServices,
    fetchAllSystemCodes,
    queryCloudHealth
}