const express = require('express');
const stripeController = require("../libs/controllers/stripe/stripe");
const webhookController = require("../libs/controllers/stripe/webhook");
const render = require("../libs/helpers/render");
const statuscodes = require("../libs/helpers/statuscodes");

module.exports = express.Router()

    // Deprecated
    // .get('/checkout', async (req, res) => {
    //     // if(process.env.ENVIRONMENT === "prod"){
    //         render(res, 400, statuscodes.NOT_ALLOWED, {"message": "Deprecated"});
    //     // }
    //     // await stripeController.checkout(req, res);
    // })

    .post('/session', async (req, res) => {
        await stripeController.createCheckoutSession(req, res);
    })

    .get('/session-free-trial', async (req, res) => {
        await stripeController.createCheckoutWithFreeTrialSession(req, res);
    })

    .get('/success', async (req, res) => {
        await stripeController.success(req, res);
    })
;