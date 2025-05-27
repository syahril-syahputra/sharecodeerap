const axios = require('axios');

const apiKey = 'AIzaSyC1pAqDQyM7Yn21eKDCSmiZI1c2yCjnTsI'; // Replace with your own Google Maps API key

async function searchPOI(keyword, location) {
    console.log(keyword)
    const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

    try {
        const response = await axios.get(url, {
            params: {
                key: apiKey,
                location: location,
                radius: 500, // Radius in meters (adjust as needed)
                keyword: keyword,
            },
        });
        console.log(response)

        const results = response.data.results;
        for (const result of results) {
            console.log(result.name);
        }
    } catch (error) {
        console.error('Error occurred:', error.message);
    }
}

// Usage example:
searchPOI('restaurant', 'Singapore'); // Example location: San Francisco
