const stripe = require('stripe')(process.env.STRIPE_SK);
const endpointSecret = process.env.STRIPE_WEBHOOK_SK;
const productAdminRepository = require("../../../libs/repositories/admin/product-repository");
const priceAdminRepository = require("../../../libs/repositories/admin/price-repository");
const productRepository = require("../../repositories/product-repository");
const statuscodes = require("../../helpers/statuscodes");
const {isUserEmailExist, registerNewUser, findUserByCustomerId, setInviteLink} = require("../../repositories/user-repository");
const WaitlistRepository = require("../../repositories/waitlist-repository");
const {getProductByStripeId} = require("../../repositories/product-repository");
const {registerNewAccount, editAccount, findAccountByCustomerId} = require("../../repositories/account-repository");
const generatePin = require("../../helpers/generatePin");
const normalizeEmail = require("normalize-email");
const crypto = require("crypto");
const countryName = require('country-list')
const Sentry = require("@sentry/node");
const mailchimpContactsService = require("../../service/mailchimpContactsService");
const mailchimpEmailService = require('../../service/mailchimpEmailService');
const { getDefault } = require('../../repositories/voiceLanguage-repository');
const logService = require('../../service/logService');
const { MailLogType, WaitlistType, PaymentSource } = require('@prisma/client');
const { getLanguagesByISO } = require('../../repositories/language-repository');
const languageService = require('../../service/languageService');

const webhookController = {

    customSubscriptionUpdated: async (subscriptionUpdated) => {
        let s = await findAccountByCustomerId(subscriptionUpdated.customer);
        if (!s) {
            console.log("User not found")
            Sentry.captureException(subscriptionUpdated);
            return;
        }


        let plan = subscriptionUpdated.plan;
        let productSubscribed = await getProductByStripeId(plan.product);
        if (!productSubscribed) {
            console.log("Account not found")
            Sentry.captureException(plan.product);
            return;
        }

        let accountUpdated = await editAccount(s.id, {
            status: 1,
            currency: subscriptionUpdated.currency,
            subscriptionDefaultPaymentMethod: subscriptionUpdated.default_payment_method,
            subscriptionCreatedAt: new Date(subscriptionUpdated.created * 1000),
            subscriptionId: subscriptionUpdated.id,
            subscriptionStatus: subscriptionUpdated.status,
            subscriptionCurrentPeriodStart: new Date(subscriptionUpdated.current_period_start * 1000),
            subscriptionCurrentPeriodEnd: new Date(subscriptionUpdated.current_period_end * 1000),
            cancel_at: subscriptionUpdated.cancel_at ? new Date(subscriptionUpdated.cancel_at * 1000) : null,
            cancel_at_period_end: subscriptionUpdated.cancel_at_period_end,
            canceled_at: subscriptionUpdated.canceled_at ? new Date(subscriptionUpdated.canceled_at * 1000) : null,
            productId: productSubscribed.id,
        });

        if (!accountUpdated) {
            console.log("Account not found")
            Sentry.captureException(s.id);
            return;
        }

        // const mailchimpAccountStatus = await mailchimpContactsService.checkAccountAudience(s.canonicalEmail);
        const userAccount = await findUserByCustomerId(subscriptionUpdated.customer);
        const username = s.name ? s.name : userAccount.firstname;

        // if (mailchimpAccountStatus === 404) {
        //     await mailchimpContactsService.createAccountAudience(s.canonicalEmail, username,
        //         productSubscribed.name,
        //         subscriptionUpdated.status,
        //         subscriptionUpdated.cancel_at ? new Date(subscriptionUpdated.cancel_at * 1000) : null,
        //         subscriptionUpdated.canceled_at ? new Date(subscriptionUpdated.canceled_at * 1000) : null);
        // } else {
        //     await mailchimpContactsService.updateAccountAudience(s.canonicalEmail, username,
        //         productSubscribed.name,
        //         subscriptionUpdated.status,
        //         subscriptionUpdated.cancel_at ? new Date(subscriptionUpdated.cancel_at * 1000) : null,
        //         subscriptionUpdated.canceled_at ? new Date(subscriptionUpdated.canceled_at * 1000) : null);
        // }

        // const sendMailWelcomeToNewPlan = await mailchimpEmailService.sendWelcomeToNewPlan(s.email, username)
            await logService.createMailLog(undefined, {
                accountId : s.id,
                type : MailLogType.NEW_PLAN,
                message : "SENT MAIL FOR ACCOUNT, CHANGING A NEW PLAN"
            })
    },

    stripeWebhook: async (req, res) => {
        let event = req.body;

        if (endpointSecret) {
            const signature = req.headers['stripe-signature'];
            try {
                event = stripe.webhooks.constructEvent(
                    req.body,
                    signature,
                    endpointSecret
                );

            } catch (err) {
                console.log(`⚠️  Webhook signature verification failed.`, err.message);
                Sentry.captureException(err);
                return res.sendStatus(400);
            }
        }

        console.log(event.type)

        try {
            switch (event.type) {
                case 'price.created':
                    const priceCreated = event.data.object;
                    await priceAdminRepository.createPrice(priceCreated);
                    break;
                case 'product.updated':
                    const product = event.data.object;
                    let data = {
                        stripeId: product.id,
                        name: product.name,
                        default_price: product.default_price,
                        active: product.active,
                        tokens: parseInt(product.metadata.tokens) || 500,
                        default: product.metadata.default === "true" || false,
                        created: new Date(product.created),
                        updated: new Date(product.updated),
                        description: product.description,
                        livemode: product.livemode,
                        tax_code: product.tax_code,
                        type: product.type,
                        url: product.url
                    }
                    let productDB = await productRepository.getProductByStripeId(product.id);
                    if (productDB) {
                        await productAdminRepository.editProduct(data, productDB.id);
                    } else {
                        const p = event.data.object;
                        await productAdminRepository.createProduct(p);
                    }
                    break;
                case 'product.deleted':
                    const deletedProduct = event.data.object;
                    await productAdminRepository.deleteProductByStripeId(deletedProduct.id);
                    break;

                //Customer

                // This is the main register
                case 'customer.created':

                    const customerCreated = event.data.object;
                    const userExists = await isUserEmailExist(customerCreated.email, res);
                    if (userExists === true) {
                        console.log("Customer already exists")
                        Sentry.captureException(customerCreated);
                        return;
                    }

                    let account = await registerNewAccount({
                        status: 1,
                        customerId: customerCreated.id,
                        email: customerCreated.email,
                        canonicalEmail: normalizeEmail(customerCreated.email),
                        name: customerCreated.name,
                        currency: customerCreated.currency,
                    });

                    if (!account) {
                        console.log("Account not found")
                        Sentry.captureException(account);
                        return;
                    }

                    let country = null;
                    if (customerCreated.address && customerCreated.address.country != null) {
                        country = countryName.getName(customerCreated.address.country)
                    }
                    let loginPin = generatePin.random(1000, 10000);
                    let loginToken = crypto.randomBytes(16).toString("hex");


                    let user = await registerNewUser({
                        firstname: customerCreated.name,
                        email: customerCreated.email,
                        loginPin: loginPin,
                        country: country,
                        loginToken: loginToken
                    }, account);
                    if (!user) {
                        console.log("User not found")
                        Sentry.captureException(customerCreated);
                        return;
                    }

                    // SET Voice
                    const iso = customerCreated.preferred_locales?.pop() || "en";
                    const language = await getLanguagesByISO(iso);
                    await languageService.setUserLanguage(
                      user,
                      language?.id || 38
                    );
                   

                    // await mailchimpContactsService.createUserAudience(normalizeEmail(customerCreated.email));

                    // If was a user from waitlist let's redeem the tokens
                    let waitlistUser = await WaitlistRepository.findOneByEmail(customerCreated.email);
                    if (waitlistUser) {
                        if(waitlistUser.status !== WaitlistType.REDEEMED_7DAYS) await WaitlistRepository.redeemToken(waitlistUser.id);
                        // await mailchimpContactsService.redeemWaitlistContact(normalizeEmail(customerCreated.email));
                        await mailchimpEmailService.sendWelcomeToFreeTrial(user.email)
                        const mailLogCreate = await logService.createMailLog(undefined, {
                            accountId : user.accountId,
                            userId : user.id,
                            type : MailLogType.CUSTOMER_CREATED,
                            message : 'Send welcome to free trial'
                        })
                    }

                    break;
                case 'customer.updated':
                    const customerUpdated = event.data.object;
                    let accountToUpdate = await findAccountByCustomerId(customerUpdated.id);
                    if (!accountToUpdate) {
                        console.log("Account not found")
                        Sentry.captureException(accountToUpdate);
                        return;
                    }

                    let userUpdated = await editAccount(accountToUpdate.id, {
                        email: customerUpdated.email,
                        name: customerUpdated.name,
                        currency: customerUpdated.currency
                    });
                    if (!userUpdated) {
                        console.log("User not found")
                        Sentry.captureException(userUpdated);
                        return;
                    }

                    break;
                case 'customer.subscription.created':
                    const userData = event.data.object;
                    const userSubs = await findAccountByCustomerId(userData.customer);
                    if (userData.status !== "trialing") {
                        await mailchimpEmailService.sendWelcomeAsPaidUser(userSubs.email, userSubs.name);
                        await logService.createMailLog(undefined, {
                            accountId : userSubs.id,
                            type : MailLogType.SUBSCRIPTION_PAID_USER,
                            message : "Customer create a Paid Subscription"
                        })
                    }

                    if(userData.status === "trialing"){
                        await webhookController.customSubscriptionUpdated(userData);
                    }
                    console.log(userData.metadata)
                    if(userData.metadata?.inviteLink !== null && userData.metadata?.inviteLink?.length > 0){
                        let inviteLinkId = parseInt(userData.metadata.inviteLink);
                        let user = await findUserByCustomerId(userData.customer);
                        await setInviteLink(user.id, inviteLinkId);
                    }

                    const deleteFromWaitlist = await WaitlistRepository.deleteWaitlist(userSubs.email)

                    break;
                case 'customer.subscription.updated':
                    const subscriptionUpdated = event.data.object;
                    await webhookController.customSubscriptionUpdated(subscriptionUpdated);
                    break;

                case 'customer.subscription.deleted':
                    const subscriptionDeleted = event.data.object;
                    console.log(subscriptionDeleted);
                    let acc = await findAccountByCustomerId(subscriptionDeleted.customer);
                    if (!acc) {
                        console.log("Customer Subscription Deleted - Account not found");
                        Sentry.captureException(subscriptionDeleted);
                        return;
                    }
                    let userDeleted = await findUserByCustomerId(subscriptionDeleted.customer);

                    let accountSubsDeleted = await editAccount(acc.id, {
                        currency: subscriptionDeleted.currency,
                        subscriptionDefaultPaymentMethod: null,
                        subscriptionCreatedAt: null,
                        subscriptionId: null,
                        subscriptionStatus: subscriptionDeleted.status,
                        subscriptionCurrentPeriodStart: null,
                        subscriptionCurrentPeriodEnd: null,
                        cancel_at: null,
                        cancel_at_period_end: null,
                        canceled_at: null,
                        productId: null,
                    });
                    if (!accountSubsDeleted) {
                        console.log("Account not found");
                        Sentry.captureException(acc);
                        return;
                    }
                    const name = acc.name ? acc.name : userDeleted.firstname;
                    await mailchimpEmailService.sendWhatDidWeDoWrong(acc.email, name);
                    const mailLogCreate = await logService.createMailLog(undefined, {
                        accountId: acc.id,
                        type: MailLogType.SUBSCRIPTION_DELETE,
                        message: 'SEND MAIL WHAT DID WE DO WRONG, account delete the subscription'
                    });
                    await logService.createTransactionLog({
                        accountId: acc.id,
                        type: PaymentSource.STRIPE,
                        data: {
                            message: "User Subscription Expired",
                        }
                    });
                    break;
                // case 'invoice.payment_failed':
                //
                //
                //
                //     break;
                default:
                    // Unexpected event type
                    console.log(`Unhandled event type ${event.type}.`);
            }

            // Return a 200 response to acknowledge receipt of the event
            res.send();
        } catch (e) {
            console.log(e)
            Sentry.captureException(e);
        }
    },
}

module.exports = webhookController;
