const UserLevelRepository = require("../repositories/user-level-repository");
const UserRepository = require("../repositories/user-repository");
const PromptRepository = require("../repositories/prompt-repository");
const pointRepository = require("../repositories/point-repository");

const userLevelsService = {

    getLevelFromPoints: async (points) => {
        let levels = await UserLevelRepository.getAll();
        let level = levels.find(level => points <= level.points);

        return level ?? levels[levels.length - 1];
    },

    updateUserLevel: async (user) => {

        let points = await pointRepository.getCurrentPoint(user.id);
        let level = await userLevelsService.getLevelFromPoints(parseInt(points));
        const update = await UserRepository.updateUserPointsAndLevel(user.id, level.id);
        return update;
    },

    updateQuestionAsked: async (user) => {
        let question = await PromptRepository.countPromptsPerUser(user.id);
        await UserRepository.updateQuestionAsked(user.id, question);
    }


}
module.exports = userLevelsService;
