const templateHelper = require("../../libs/helpers/template");

function initialPrompt(prompt, categories, location, numberOfPoints) {
    const result = templateHelper.replacePlaceholders(prompt, {
        location: location,
        numberOfPoints: numberOfPoints,
        categories: categories.map((category) => `\t${category.id} - ${category.name}`).join('\n')
    });

    return result;
}

module.exports = initialPrompt;