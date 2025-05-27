const express = require('express');

const { authAdmin } = require('../../libs/middleware/lib-auth');
const adminAccount = require("../../libs/controllers/admin/admin-account");
const adminSessions = require("../../libs/controllers/admin/admin-sessions");
const account = require("../../libs/controllers/accounts");

module.exports = express.Router()

	.use(authAdmin)
    .get('/', async (req, res) => {
        await adminAccount.getAccounts(req, res);
    })
    .get('/users/subscribers', async (req, res) => {
        await adminAccount.getSubscribers(req, res);
    })
    .get('/users/export-subscriber', async (req, res) => {
        await adminAccount.downloadSubscriber(req, res);
    })
    .get('/users/free-trial', async (req, res) => {
        await adminAccount.getFreetrials(req, res);
    })
    .get('/abandoned', async (req, res) => {
        await adminAccount.getAbandonedUser(req, res);
    })
    .post('/usage', async (req, res) => {
        await adminAccount.getAccountUsage(req, res);
    })
    .post('/global-usage', async (req, res) => {
        await adminAccount.getGlobalUsage(req, res);
    })

    .get('/:id/users', async (req, res) => {
        await adminAccount.getUsers(req, res);
    })

    .get('/:id', async (req, res) => {
        await adminAccount.getAccountDetail(req, res);
    })
    .delete('/:id', async (req, res) => {
        await adminAccount.deleteAccount(req, res);
    })
    .put('/disenable/:id', async (req, res) => {
        await adminAccount.disenableAccount(req, res);
    })
    .put('/expired-date/:id', async (req, res) => {
        await adminAccount.changeExpired(req, res);
    })
    .put('/force-expired/:id', async (req, res) => {
        await adminAccount.forceExpired(req, res);
    })
    .put('/token/:id', async (req, res) => {
        await adminAccount.createEditCustomToken(req, res);
    })
    .post('/reset-token/:id', async (req, res) => {
        await adminAccount.resetAccountTokenUsage(req, res);
    })
    .post('/receipt', async (req, res) => {
        await adminAccount.verifyReceipt(req, res);
    })
;

