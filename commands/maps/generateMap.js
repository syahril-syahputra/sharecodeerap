require('dotenv-safe').config({allowEmptyValues: true});

const {PrismaClient} = require('@prisma/client');
const ChatGptService = require("./simpleChatGPT");
const initialPrompt = require("./initialPrompts");
const prisma = require("../../libs/lib-prisma");
const generatePointsForCountry = require("./generatePois");


const init = async () => {

    let numberOfPois = 10;
    let poisPerRequest = 5;
    // let listOfCountries = [133, 150, 215, 37, 120, 236, 33, 196, 173, 102];
    let listOfCountries = [102];

    const promises = [];
    for (const countryId of listOfCountries) {
        // promises.push(generatePointsForCountry(numberOfPois, poisPerRequest, countryId, "Sumatra"));
        promises.push(generatePointsForCountry(numberOfPois, poisPerRequest, countryId, null));
    }

    Promise.all(promises)
        .then(() => {
            console.log("All function calls completed.");
        })
        .catch(error => {
            console.error("An error occurred:", error);
        });
}


init();