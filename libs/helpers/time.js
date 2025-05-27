const getExpiration = () => {
    let dateObj = new Date();
    let h = 4;
    dateObj.setTime(dateObj.getTime() + (h * 60 * 60 * 1000));
    return dateObj;
}

const getExpirationFor2Days = () => {
    let dateObj = new Date();
    dateObj.setTime(dateObj.getTime() + (2 * 24 * 60 * 60 * 1000));
    return dateObj;
}

module.exports = {getExpiration, getExpirationFor2Days};