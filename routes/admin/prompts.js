const express = require("express");

const {
    authAdmin
} = require("../../libs/middleware/lib-auth");
const adminPrompts = require("../../libs/controllers/admin/admin-prompts");

module.exports = express
    .Router()

    .use(authAdmin)
    .get("/:sessionId", async (req, res) => {
        await adminPrompts.getPrompts(req, res);
    })
    .get("/fact/:userId", async (req, res) => {
        await adminPrompts.getUserFactPrompts(req, res);
    })
    .get("/story/:userId", async (req, res) => {
        await adminPrompts.getUserStoryPrompts(req, res);
    })
    .get("/quiz-explain-more/:userId", async (req, res) => {
        await adminPrompts.getQuizExplainMorePrompts(req, res);
    })
    .get("/assistant/:userId", async (req, res) => {
        await adminPrompts.getPromptsAssistant(req, res);
    })
    .get("/dalle/:userId", async (req, res) => {
        await adminPrompts.getDallePrompt(req, res);
    });