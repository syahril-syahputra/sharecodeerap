const express = require('express');

const { authAdmin } = require('../../libs/middleware/lib-auth');
const adminPrompts = require("../../libs/controllers/admin/admin-prompts");
const adminSessions = require("../../libs/controllers/admin/admin-sessions");

module.exports = express.Router()

	.use(authAdmin)
    .get('/:userId/session/:sessionId', async (req, res) => {
        await adminSessions.getSessionDetail(req, res);
    })
    .get('/:userId', async (req, res) => {
        await adminSessions.getSessions(req, res);
    })

;

