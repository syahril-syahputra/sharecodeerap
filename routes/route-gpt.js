const express = require("express");
const routeGpt = require("../libs/controllers/gpt/gpt");
const { auth } = require("../libs/middleware/lib-auth");
const bodyParser = require("body-parser");
const handleRawData = express.raw({ type: "*/*", limit: "20mb" });
module.exports = express
    .Router()

    .use(auth)
    .post("/process", async (req, res) => {
        await routeGpt.process(req, res);
    })
    .post("/explain-more/:promptId", async (req, res) => {
        await routeGpt.explainMore(req, res);
    })
    .post("/fun-facts/:promptId", async (req, res) => {
        await routeGpt.funFacts(req, res);
    })
    .post("/facts/:topicId", async (req, res) => {
        await routeGpt.facts(req, res);
    })
    .post("/facts-llama3/:topicId", async (req, res) => {
        await routeGpt.factsUsingLlma(req, res);
    })
    .post("/facts-prompt/:promptId", async (req, res) => {
        await routeGpt.factsUsingPrompt(req, res);
    })
    .post("/facts-emoji", async (req, res) => {
        await routeGpt.factsUsingEmoji(req, res);
    })
    .post("/facts-llama3-prompt/:promptId", async (req, res) => {
        await routeGpt.factsUsingLlama3AndPrompt(req, res);
    })
    .post("/story", async (req, res) => {
        await routeGpt.story(req, res);
    })
    .post("/story-llama3", async (req, res) => {
        await routeGpt.storyUsingLlama3(req, res);
    })
    .post("/quiz/:topicId", async (req, res) => {
        await routeGpt.createQuiz(req, res);
    })
    .post("/quiz-prompt/:promptId", async (req, res) => {
        await routeGpt.createQuizUsingPrompt(req, res);
    })

    .post("/quiz-emoji", async (req, res) => {
        await routeGpt.createQuizUsingEmoji(req, res);
    })
    .post("/quiz/explain-more/:quizEntryId", async (req, res) => {
        await routeGpt.quizExplainMore(req, res);
    })
    .post("/quiz/explain-more-llama3/:quizEntryId", async (req, res) => {
        await routeGpt.quizExplainMoreLlama3(req, res);
    })
    .post("/quiz-llama3/:topicId", async (req, res) => {
        await routeGpt.createQuizUsingLlama(req, res);
    })
    .post("/quiz-llama3-prompt/:promptId", async (req, res) => {
        await routeGpt.createQuizUsingLlamaAndPrompt(req, res);
    })
    .post("/idle", async (req, res) => {
        await routeGpt.idle(req, res);
    })
    // .use(bodyParser.raw({ type: "*/*", limit: "20mb" }))
    .post("/ai-stt-process", handleRawData, async (req, res) => {
        // console.log(req.body, 'body')
        await routeGpt.openAiSttProcess(req, res);
    })
    .post("/groq-stt-process", handleRawData, async (req, res) => {
        // console.log(req.body, 'body')
        await routeGpt.sttProccessLlama(req, res);
    })
    .post("/whisper-stt-process", handleRawData, async (req, res) => {
        // console.log(req.body, 'body')
        await routeGpt.sttProccessWhisper(req, res);
    })
    .post("/dalle", async (req, res) => {
        await routeGpt.dalle(req, res);
    })

    // to process audio record -> response text -> process the text directly
    .post("/stt-process", handleRawData, async (req, res) => {
        // console.log(req.body, 'body')
        await routeGpt.sttProcess(req, res);
    })
     .post("/stt-process-emoji", handleRawData, async (req, res) => {
        // console.log(req.body, 'body')
        await routeGpt.sttProcessEmoji(req, res);
    })

    // getting the processed prompt
    .post("/references-process", async (req, res) => {
        // console.log(req.body, 'body')
        await routeGpt.openAiProcessByReference(req, res);
    })
