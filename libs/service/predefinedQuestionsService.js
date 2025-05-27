const prisma = require("../lib-prisma");

const ChatGPTService = require("./simpleChatGPTService");

const service = {
    generate4QuestionsPerLanguageTopicAndAgeRange: async (
        topicId,
        ageRangeId,
        languageId,
        prompt
    ) => {
        // console.log(topicId)
        // console.log(ageRangeId)
        // console.log(languageId)

        try {
            const topic = await prisma.topic.findFirst({
                where: {
                    id: topicId,
                },
            });

            // console.log(topic, "topic");

            const ageRange = await prisma.ageRange.findFirst({
                where: {
                    id: ageRangeId,
                },
            });

            // console.log(ageRange, "ageRange");

            const language = await prisma.language.findFirst({
                where: {
                    id: languageId,
                },
            });

            // console.log(language, "language");

            // let prompt = service.initialPrompt(topic, ageRange, language);
            let resultPrompt = prompt
                .replace("{{topic}}", topic.name)
                .replace("{{language}}", language.name)
                .replace("{{minAge}}", ageRange.minAge)
                .replace("{{maxAge}}", ageRange.maxAge);

            let messages = [];
            messages.push({
                role: "system",
                content:
                    "You are a helpful assistant that only talks in JSON, return an array of strings.",
            });
            messages.push({
                role: "user",
                content: `${resultPrompt}`,
            });

            // console.log(messages);

            let questions = await ChatGPTService.requestChatGPT(messages);
            if (!questions || questions.length <= 0) {
                return;
            }
            // console.log(questions);
            let questionsArray = JSON.parse(questions);
            // console.log(questionsArray)
            let fullQuestions = questionsArray.map((q) => {
                return {
                    question: q,
                    topicId: topicId,
                    ageRangeId: ageRangeId,
                    languageId: languageId,
                };
            });

            const result = await prisma.predefinedQuestions.createMany({
                data: fullQuestions,
                skipDuplicates: true,
            });

            return result;
        } catch (e) {
            console.log(e);
        }
    },

    initialPrompt: (topic, ageRange, language) => {
        return `Based on this topic "${topic.name}" please generate an interesting fact and encourage the user (a kid) to start a conversation about this topic in ${language.name}. 
The target users are kids between ${ageRange.minAge} and ${ageRange.maxAge} years old.
I expect only a Array of strings as a result with 4 questions.
One example could be, "do you know that the apples are red, green or yellow? Do you like apples?".
Don't display a object with a key named 'questions', return an array of strings.
Remember an interesting fact and a question to start a conversation. Don't forget the interesting fact.
`;
    },
};
module.exports = service;
