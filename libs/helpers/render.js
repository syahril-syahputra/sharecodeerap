const statuscodes = require('./statuscodes');


const render = (res, status, customStatus, payload, pagination = {}) => {

    if (payload === null) {
        payload = {};
    }
    let ret_obj = {};
    ret_obj.data = payload;
    // ret_obj.pagination = pagination;

    let customStatusMsg = "";
    if (payload.error !== undefined) {
        if (payload.error.hasOwnProperty('details')) {
            customStatusMsg = payload.error.details[0].message;
        } else {
        }
    } else {
        if (customStatus === 1) {
            customStatusMsg = "Ok";
        }
    }

    let debug = "";
    for (var statuscode in statuscodes) {
        if (statuscodes.hasOwnProperty(statuscode)) {
            if (statuscodes[statuscode] === customStatus) {
                debug = statuscode;
                break;
            }
        }
    }
    ret_obj.statusCode = {
        code: customStatus,
        msg: customStatusMsg,
        debug: debug,
    }

    res.status(status);
    res.send(ret_obj);
}

module.exports = render;