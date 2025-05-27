const axios = require('axios');



async function getGeocodeData(address) {
    const apiKey = 'AIzaSyC1pAqDQyM7Yn21eKDCSmiZI1c2yCjnTsI';
    const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
    )}&key=${apiKey}`;

    try {
        const response = await axios.get(apiUrl);
        const data = response.data;

        console.log(data)

        if (data.status === 'OK') {
            // Geocode data is available
            const location = data.results[0].geometry.location;
            console.log('Latitude:', location.lat);
            console.log('Longitude:', location.lng);
        } else {
            // Geocode data is not available or an error occurred
            console.log('Geocode API Error:', data.status);
        }
    } catch (error) {
        console.log('Error:', error.message);
    }
}

// Usage example
getGeocodeData('Barcelona, Spain');
