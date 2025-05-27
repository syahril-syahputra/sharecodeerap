const express = require('express');
const account = require("../libs/controllers/auth");
const { auth } = require('../libs/middleware/lib-auth');
module.exports = express.Router()

    .post('/check', async (req, res) => {
        await account.checkExisting(req, res);
    })
    // // Register DEPRECATED, using stripe register
    // .post('/register', async (req, res) => {
    //     await account.register(req, res);
    // })

    .get('/stripe-visibility', async (req, res) => {
        await account.checkStripeVisibility(req, res);
    })

    .post('/email-receipt', async (req, res) => {
        await account.checkReceiptEmail(req, res);
    })

    .post('/create-user', async(req, res) => {
        await account.createNewUser(req, res);
    })

    .post('/create-subscription', async (req, res) => {
        await account.createSubscriptionNewFlow(req, res);
    })

    // Login
    .post('/request-login', async (req, res) => {
        await account.requestLogin(req, res);
    })

    .post('/login-token', async (req, res) => {
        await account.loginUsingEmail(req, res);
    })

    .post('/login-pin', async (req, res) => {
        await account.loginPin(req, res);
    })

    // Confirm
    .post('/confirm', async (req, res) => {
        await account.confirm(req, res);
    })
    .post('/confirm/resend', async (req, res) => {
        await account.resendConfirmationEmail(res, req);
    })

    // Forgot
    //DEPRECATED NOT USED
    .post('/forgot', async (req, res) => {
        await account.forgotPass(req, res);
    })

    // Set password
    //DEPRECATED NOT USED
    .post('/set-password', async (req, res) => {
        await account.setPass(req, res);
    })

    
    .use(auth)
    // Logout
    .post('/logout', async (req, res) => {
        await account.logout(req, res);
    })
    .get('/loginUser', async (req, res) => {
        await account.getLoginUser(req, res);
    })
;