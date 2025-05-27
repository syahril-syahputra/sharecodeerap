require('dotenv-safe').config({allowEmptyValues : true});
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const init = async ()=>{

    const topic = 'Lake Toba';
    let accessKey = process.env.UNSPLASH_ACCESS_KEY;

    axios.get(`https://api.unsplash.com/photos?query=${topic}`, {
        headers: {
            'Authorization': `Client-ID ${accessKey}`
        }
    })
        .then(response => {
            console.log(response.data)
            const imageUrl = response.data.urls.regular;
            console.log('Image URL:', imageUrl);
        })
        .catch(error => {
            console.log('Error occurred:', error);
        });
}
init();