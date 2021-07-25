const getQueryParams = () => {
    const queryParams = {};
    const queryParamsArr = window.location.search.substr(1, window.location.search.length).split("&");
    queryParamsArr.forEach(qp => {
        const [key, val] = qp.split("=");
        // Ignore values which are ""
        if(key.length) queryParams[key] = val;
    });
    return queryParams;
}

const setQueryParams = (params = null, keepExisting=true) => {
    const existingParams = keepExisting ? getQueryParams() : {};
    const newParams = Object.assign({}, existingParams, params);

    let newUrl = `${process.env.APP_BASE_URL}?`;
    for(let key in newParams) {
        newUrl += `${key}=${newParams[key]}&`;
    }

    // Remove the triling &
    newUrl = newUrl.substr(0, newUrl.length -1);
    
    // Update url query params
    window.history.pushState({ path: newUrl }, '', newUrl);
}

const unsetQueryParams = (keys) => {
    const allParams = getQueryParams();
    const newParams = {};
    for(let key in allParams) {
        if(!keys.includes(key))
            newParams[key] = allParams[key];
    }
    setQueryParams(newParams, false);
};

module.exports = {
    getQueryParams,
    setQueryParams,
    unsetQueryParams
}