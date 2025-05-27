const prisma = require("../lib-prisma");

const PoiRepository = require("../repositories/admin/poi-repository");

const poiService = {

    generatePointsForCountry: async (numberOfPois, poisPerRequest, countryId, place) => {

        try {
            const country = await prisma.country.findFirst({
                where: {
                    id: countryId,
                }
            });

            let location = place ? `${place}, ${country.name}` : country.name;

            console.log(`Generating ${numberOfPois} POIs for ${location}`)

            const categories = await prisma.poiCategory.findMany();
            let prompt = initialPrompt(categories, location, poisPerRequest);

            for (let i = 0; i < numberOfPois; i += poisPerRequest) {

                const existingPoisPerCountry = await prisma.poi.findMany({
                    where: {
                        countryId: countryId,
                    }
                });
                let toExclude = existingPoisPerCountry.map(poi => poi.name);

                let messages = [];
                messages.push({
                    "role": "system",
                    "content": "You are a helpful assistant that only talks in JSON, return an array of objects instead. Don't display a object with a key named 'pointsOfInterest'"
                });
                messages.push({
                    "role": "user",
                    "content": `${prompt}. \nExclude these points: [${toExclude.join(", ")}]. Don't display a key named pointsOfInterest`
                });

                // console.log("--------")
                console.log(messages);

                let response = await ChatGptService.requestChatGPT(messages);
                console.log(response);
                let result = JSON.parse(response);
                console.log(result)
                await PoiRepository.insertPois(result, country);
            }

            // console.log("=========");
            // console.log(chatGPTResult)
            // console.log("=========");

            // console.log(result);

        } catch (e) {
            console.log(e);
        }
    },

    initialPrompt: async (categories, location, numberOfPoints) => {

        return `I want to fill a map with just only ${location} points of interest for kids to learn things. 
    I want ${numberOfPoints} points of interest about ${location}. 
Each point of interest have to be one of these categories:
${categories.map((category) => `\t${category.id} - ${category.name}`).join('\n')}
Don't add commercial venues, museums or zoos.
I expect only a Json Array as a result, with this format:
[
{
\tname: "The tiger of Sumatra", // Don't add the type as in for Bali, don't add Bali 'Island', or the same for a mountain, temple etc..
\tlatitude: 4.33333,
\tlongitude: 34.3333,
\tcategory: 5, // the id from the category
\tdescription: "Short description here",
}
...
]
no prose. Don't display a object with a key named 'pointsOfInterest', return an array or objects.`;

    }

}
module.exports = poiService;
