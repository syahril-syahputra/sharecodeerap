const ejs = require("ejs");
const render = require("../../helpers/render");
const fs = require("fs");
const statuscodes = require("../../helpers/statuscodes");
const { findUserByCustomerId } = require("../../repositories/user-repository");
const UserRepository = require("../../repositories/user-repository");
const AccountRepository = require("../../repositories/account-repository");
const { getProductById } = require("../../repositories/product-repository");
const WaitlistRepository = require("../../repositories/waitlist-repository");
const Sentry = require("@sentry/node");
const logService = require("../../service/logService");
const { LogType, WaitlistType, PaymentSource } = require("@prisma/client");
const redis = require("../../lib-ioredis");
const Joi = require("joi");
const {
    sendWelcomeToFreeTrial,
} = require("../../service/mailchimpEmailService");
const { getLanguagesById } = require("../../repositories/language-repository");

const publicController = {
    // We don't need this endpoint as the redirects will be done from the app itself.
    // The app has to call directly to the endpoint createCheckoutSession passing the proper priceId
    // that they want to use
    // also we can leave this page protected just for us to do some testing from the browser.
    // checkout: async (req, res) => {
    //     let result = await ejs.renderFile(process.cwd() + '/templates/stripe/checkout.html');
    //     res.send(result);
    // },

    createCheckoutSession: async (req, res) => {
        const stripe = require("stripe")(process.env.STRIPE_SK);
        const priceId = req.body.price;
        const email = req.body.email;
        const language = req.body.languageId;

        const stripeLocale = [
            "bg",
            "cs",
            "da",
            "de",
            "el",
            "en",
            "en-GB",
            "es",
            "es-419",
            "et",
            "fi",
            "fil",
            "fr",
            "fr-CA",
            "hr",
            "hu",
            "id",
            "it",
            "ja",
            "ko",
            "lt",
            "lv",
            "ms",
            "mt",
            "nb",
            "nl",
            "pl",
            "pt",
            "pt-BR",
            "ro",
            "ru",
            "sk",
            "sl",
            "sv",
            "th",
            "tr",
            "vi",
            "zh",
            "zh-HK",
            "zh-TW",
        ];

        let lang = await getLanguagesById(language);
        let locale;

        if (!lang) {
            locale = "en";
        } else {
            if (lang.iso == "ca") {
                locale = "es";
            } else if (stripeLocale.includes(lang.iso)) {
                locale = lang.iso;
            } else {
                locale = "en";
            }
        }

        console.log(locale, "Create Checkout Session ISO");

        let account = await AccountRepository.findAccountByEmail(email);
        if (account) {
            render(res, 400, statuscodes.ACCOUNT_ALREADY_EXISTS, {});
            return;
        }
        let user = await UserRepository.findAnyUserByEmail(email);
        if (user) {
            render(res, 400, statuscodes.USER_ALREADY_EXISTS, {});
            return;
        }

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url:
                process.env.FRONTEND_URL +
                "/stripe/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url: process.env.FRONTEND_URL + "/public/cancel.html",
            customer_email: email,
            allow_promotion_codes: true,
            consent_collection: {
                terms_of_service: "required",
            },
            locale,
        });

        if (session.status == 400) {
            console.log(session.status, "Statuscodes Create Checkout Session");
            render(res, 400, statuscodes.BAD_REQUEST, {});
            return;
        }

        render(res, 200, statuscodes.OK, session.url);
    },

    createCheckoutWithFreeTrialSession: async (req, res) => {
        const stripe = require("stripe")(process.env.STRIPE_SK);
        let token = req.query.token;
        let email = req.query.email;
        // TODO

        let user = await WaitlistRepository.findOneByInvitationToken(token);
        if (!user) {
            render(res, 400, statuscodes.TOKEN_NOT_FOUND, {});
            return;
        } else if (new Date() > user.inviteTokenExpires) {
            render(res, 400, statuscodes.TOKEN_EXPIRED, {
                error: {
                    details: [
                        { message: "This invite link is no longer valid" },
                    ],
                },
            });
            return;
        } else if (user.status === WaitlistType.REDEEMED) {
            render(res, 400, statuscodes.TOKEN_ALREADY_REDEEMED, {});
            return;
        }

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [
                {
                    price: process.env.FREE_TRIAL_PRICING_PLAN_ID,
                    quantity: 1,
                },
            ],
            success_url:
                process.env.FRONTEND_URL +
                "/stripe/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url: process.env.FRONTEND_URL + "/public/cancel.html",
            customer_email: user.email,
            allow_promotion_codes: true,
            consent_collection: {
                terms_of_service: "required",
            },
            subscription_data: {
                trial_settings: {
                    end_behavior: {
                        missing_payment_method: "cancel",
                    },
                },
                trial_period_days: 7,
            },
            payment_method_collection: "if_required",
        });

        // const sendEmail = await sendWelcomeToFreeTrial(email)

        // render(res, 200, statuscodes.OK, session.url);
        res.redirect(session.url);
    },

    customerPortal: async (req, res) => {
        const stripe = require("stripe")(process.env.STRIPE_SK);
        let locale;
        const { iso } = req.user.Language;
        if (iso == "ca") locale = "es";
        else locale = iso;
        const returnUrl = process.env.FRONTEND_URL;
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: req.user.account.customerId,
            return_url: returnUrl,
            locale,
        });

        await logService.createLog(req, {
            type: LogType.CREATE_PORTAL_SESSION,
            message: `Create session User with id : ${req.user.id}`,
        });

        render(res, 200, statuscodes.OK, portalSession.url);
    },

    success: async (req, res) => {
        const stripe = require("stripe")(process.env.STRIPE_SK);
        const session = await stripe.checkout.sessions.retrieve(
            req.query.session_id
        );

        let user = await findUserByCustomerId(session.customer);

        await redis.publish(
            "mattermost:userpayment",
            JSON.stringify({
                user: user,
                paymentSource: PaymentSource.STRIPE,
                plan: user.account.Product.name,
            })
        );

        let result = await ejs.renderFile(
            process.cwd() + "/templates/stripe/success.html",
            {
                pin: user.loginPin,
                link:
                    process.env.FRONTEND_URL +
                    "/redirect/confirmation/" +
                    user.loginToken,
                // checkout_session_id: req.query.session_id
            }
        );

        res.send(result);
    },

    createSubscription: async (req, res) => {
        const stripe = require("stripe")(process.env.STRIPE_SK);

        let price = await getProductById(req.body.productId);
        if (!price) {
            render(res, 400, statuscodes.PRODUCT_NOT_FOUND, {});
            return;
        }

        try {
            // Before doing the subscription we will by default use the credit card
            // as a default payment method or the subscripton will fail.

            const paymentMethods = await stripe.paymentMethods.list({
                customer: req.user.account.customerId,
                type: "card",
            });

            // TODO change this
            // but for now we pick the first one as the default payment method

            await stripe.customers.update(req.user.account.customerId, {
                invoice_settings: {
                    default_payment_method: paymentMethods.data[0]?.id,
                },
            });

            // const country = paymentMethods.data[0]?.billing_details?.address?.country;
            // console.log(country, 'Country from create subscription')

            const subscription = await stripe.subscriptions.create({
                customer: req.user.account.customerId,
                items: [{ price: req.body.priceId }],
            });
            if (!subscription) {
                render(res, 400, statuscodes.INTERNAL_ERROR, {});
                return;
            }

            await logService.createLog(req, {
                type: LogType.CREATE_SUBSCRIPTION,
                message: `Create Subsciprion by user with id : ${
                    req.user.id
                } at ${new Date()}`,
            });

            await redis.publish(
                "mattermost:userpayment",
                JSON.stringify({
                    user: req.user,
                    paymentSource: PaymentSource.STRIPE,
                    plan: price.name,
                })
            );

            render(res, 200, statuscodes.OK, subscription);
        } catch (e) {
            console.log(e);
            console.error(e?.raw?.message);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, e?.raw?.message);
        }
    },
    createFreeTrialSessionUrl: async (email, iso = "en") => {
        try {
            const stripe = require("stripe")(process.env.STRIPE_SK);
            let locale;
            if (iso == "ca") locale = "es";
            else locale = iso;
            const session = await stripe.checkout.sessions.create({
                mode: "subscription",
                line_items: [
                    {
                        price: process.env.FREE_TRIAL_PRICING_PLAN_ID,
                        quantity: 1,
                    },
                ],
                success_url:
                    process.env.FRONTEND_URL +
                    "/stripe/success?session_id={CHECKOUT_SESSION_ID}",
                cancel_url: process.env.FRONTEND_URL + "/public/cancel.html",
                locale,
                customer_email: email,
                allow_promotion_codes: true,
                consent_collection: {
                    terms_of_service: "required",
                },
                subscription_data: {
                    trial_settings: {
                        end_behavior: {
                            missing_payment_method: "cancel",
                        },
                    },
                    trial_period_days: 7,
                },
                payment_method_collection: "if_required",
            });
            // console.log(session)
            return session.url;
        } catch (e) {
            console.log(e);
            console.error(e?.raw?.message);
            Sentry.captureException(e);
        }
    },
};
module.exports = publicController;
