require('dotenv-safe').config({allowEmptyValues: true});

const {PrismaClient} = require('@prisma/client');
const ChatGptService = require("./simpleChatGPT");
const initialPrompt = require("./initialPrompts");
const prisma = require("../../libs/lib-prisma");


const generatePointsForCountry = async (numberOfPois, poisPerRequest, countryId, place, selectedCategories, givenPrompt) => {

    try {
        const country = await prisma.country.findFirst({
            where:{
                id: countryId,
            }
        });

        let location = place ? `${place}, ${country.name}` : country.name;

        console.log(`Generating ${numberOfPois} POIs for ${location}`)


        let categories = [];
        if(selectedCategories && selectedCategories.length > 0){
            categories = await prisma.poiCategory.findMany({
                where: {
                    id: {
                        in: selectedCategories,
                    },
                },
            });
        }else{
            categories = await prisma.poiCategory.findMany();
        }

        let prompt = initialPrompt(givenPrompt, categories, location, poisPerRequest);

        for (let i = 0; i < numberOfPois; i += poisPerRequest) {

            const existingPoisPerCountry = await prisma.poi.findMany({
                where:{
                    countryId: countryId,
                }
            });
            let toExclude = existingPoisPerCountry.map(poi => poi.name);

            let messages = [];
            messages.push({"role": "system", "content": "You are a helpful assistant that only talks in JSON, return an array of objects instead. Don't display a object with a key named 'pointsOfInterest'"});
            messages.push({"role": "user", "content": `${prompt}. \nExclude these points: [${toExclude.join(", ")}]. Don't display a key named pointsOfInterest` });

            // console.log("--------")
            // console.log(messages);

            let response = await ChatGptService.requestChatGPT(messages);
            let result = JSON.parse(response);
            await insertPois(result, country);
        }

    } catch (e) {
        console.log(e);
    }
}

const insertPois = async (pois, country) => {

    for (const poi of pois) {

        let isRepeated = await prisma.poi.findFirst({
            where:{
                name: poi.name
            }
        });
        if(isRepeated){
            continue;
        }

        // console.log(poi)
        let poiData = {
            name: poi.name,
            latitude: poi.latitude,
            longitude: poi.longitude,
            description: poi.description,
            categoryId: poi.category,
            countryId: country.id,
            generatedAt: new Date(),
        }

        let mainPoi = await prisma.poi.create({
            data: poiData
        });
        // console.log(mainPoi)
        //
        // for (const related of poi.relateds) {
        //
        //     let poiRelated = {
        //         name: related.name,
        //         latitude: related.latitude,
        //         longitude: related.longitude,
        //         description: related.description,
        //         categoryId: related.category,
        //         poiId: mainPoi.id
        //     }
        //
        //     let result = await prisma.poiRelated.create({
        //         data: poiRelated
        //     });
        // }
    }
    // console.log(country);
    // console.log(pois);
}

module.exports = generatePointsForCountry;