require("dotenv-safe").config({ allowEmptyValues: true });
const dalleService = require("../../libs/service/dalleService");

async function init() {
    let prompt =
        "Create a vibrant, blackboard-style image that visually communicates the jungle in a way that is accessible and engaging for children. The illustration should be rich with colors and easy-to-understand imagery that symbolizes key aspects of jungle, without any text or labels. The blackboard should serve as the backdrop, filled with colorful chalk drawings that represent jungle through clear visual metaphors and symbols. The style should be consistent and simplified to maintain attention and foster curiosity among young learners.";

    let resultPrompt = await dalleService.generateImage(prompt);
    console.log(resultPrompt);
}

init();
