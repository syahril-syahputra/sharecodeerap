const express = require("express");
const account = require("../libs/controllers/accounts");
const { auth } = require("../libs/middleware/lib-auth");
const stripeController = require("../libs/controllers/stripe/stripe");
module.exports = express
    .Router()

    .post("/onboarding-email", async (req, res) => {
        await account.recordOnboardingEmail(req, res);
    })

    .use(auth)
    .post("/usage", async (req, res) => {
        await account.getAccountUsage(req, res);
    })

    .get("/", async (req, res) => {
        await account.getAccount(req, res);
    })

    .get("/users", async (req, res) => {
        await account.getUsers(req, res);
    })

    .post("/customer-portal", async (req, res) => {
        await stripeController.customerPortal(req, res);
    })

    .post("/subscribe", async (req, res) => {
        await stripeController.createSubscription(req, res);
    })

    .put("/renewal-subscription", async (req, res) => {
        await account.upgradeAppleSubscription(req, res);
    })

    .post("/renew-subscription-receipt", async (req, res) => {
        await account.renewSubscriptionFromReceipt(req, res);
    })

    .post("/delete-account", async (req, res) => {
        await account.deleteAccount(req, res);
    });
