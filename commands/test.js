require('dotenv-safe').config({allowEmptyValues: true});

// const sessionRepository = require("../libs/repositories/session-repository");
// const promptRepository = require("../libs/repositories/prompt-repository");
// const accountRepository = require("../libs/repositories/account-repository");
// const promptService = require("../libs/service/promptService");
const {PrismaClient} = require('@prisma/client');
// const sessionHelper = require("../libs/helpers/session");
const prisma = new PrismaClient();
const mailchimp = require("@mailchimp/mailchimp_marketing")
const templateHelper = require("../libs/helpers/template")
const mailchimpHasher = require("../libs/helpers/mailchimp");
const {
    openAITokensSpentPerAccount,
    charactersSentToGooglePerAccount
} = require("../libs/repositories/prompt-repository");
const {getProductById} = require("../libs/repositories/product-repository");
//
// const checkExpiredSessions = async ()=>{
//
//     let accountToUpdate = await accountRepository.findAccountByCustomerId("cus_NV3LlfKbNRx7Fa");
//     console.log(accountToUpdate)
// }
// checkExpiredSessions();

const sendMailchimpEmail = async () => {
    // // console.log("sending mailchimp email")
    // // mailchimp.setConfig({
    // //     apiKey: process.env.MAILCHIMP_API_KEY,
    // //     server: process.env.MAILCHIMP_SERVER,
    // // });
    // //
    // // const response = await mailchimp.lists.getListMember(
    // //     "7808db28d9",
    // //     "ca16b37e10bc546a29cd94ca0d118bb9"
    // // );
    //
    // // console.log(response)
    //
    // // Add user to list
    // // mailchimp.lists.addListMember(listId, {
    // //     email_address: email,
    // //     status: 'subscribed',
    // //     email_type: 'html',
    // //     merge_fields: {
    // //         FNAME: firstname,
    // //         LNAME: lastname
    // //     },
    // //     tags: [tag]
    // // })
    //
    // // Send email
    // // await mailchimp.campaigns.send(campaignId)
    //
    // let account = await prisma.account.findUnique({
    //     where: {
    //         id: 1
    //     }
    // })
    //
    // console.log(account)
    //
    // let openAiTokensSpent = await openAITokensSpentPerAccount(account.id, account.subscriptionCurrentPeriodStart, account.subscriptionCurrentPeriodEnd);
    //
    // console.log("openAiTokensSpent " + openAiTokensSpent)
    //
    // let charsSentToGoogle = await charactersSentToGooglePerAccount(account.id, account.subscriptionCurrentPeriodStart, account.subscriptionCurrentPeriodEnd);
    //
    // console.log("characters sent to Google " + charsSentToGoogle)
    //
    // let eurekaTokensSpent = process.env.RATIO_EUREKA_TO_OPENAI_TOKENS * openAiTokensSpent +
    //     process.env.RATIO_EUREKA_TO_TTS_CHARS * charsSentToGoogle
    // ;
    //
    // console.log("first " + process.env.RATIO_EUREKA_TO_OPENAI_TOKENS * openAiTokensSpent)
    // console.log("second " + process.env.RATIO_EUREKA_TO_TTS_CHARS * charsSentToGoogle)
    //
    // let product = await getProductById(account.productId);
    //
    // console.log("Available " + product.tokens);
    // console.log("Spent " + eurekaTokensSpent);

    // return eurekaTokensSpent < product.tokens;
    // const stripe = require('stripe')(process.env.STRIPE_SK);
    //
    // try {
    //     const subscription = await stripe.subscriptions.retrieve("sub_1NIAcjLkfenXMQDEP1X03Hww");
    //     const status = subscription.status;
    //     console.log('Current subscription status:', status);
    // } catch (err) {
    //     console.error('Error retrieving subscription:', err);
    // }

    let template = "Tu es Eureka un robot encyclopédie. Tu parles avec {{user.firstname}} qui a {{user.age}}. Tu évite de vouvoyer, tu preferes le tutoiement. Tu fais des phrases courtes et n'utilise pas de mots compliqués. Tu parles en Francais.";

    let data = {
        language: {
            id: 38,
            createdAt: "2023-02-16T02:19:18.955Z",
            updatedAt: "2023-02-16T02:19:18.955Z",
            iso: 'en',
            name: 'English'
        },
        user: {
            id: 95,
            createdAt: "2023-03-14T04:53:47.528Z",
            updatedAt: "2023-03-14T04:53:47.528Z",
            email: 'joan.ilari+pin32@mediatropy.com',
            pin: 1111,
            accountId: 76,
            canonicalEmail: 'joan.ilari+pin32@mediatropy.com',
            firstname: 'Joan',
            lastname: 'surname2',
            password: null,
            passwordReset: null,
            resetToken: null,
            resetTokenExpires: null,
            isAdmin: true,
            verified: true,
            lastLogin: "2023-07-06T03:18:35.004Z",
            lastInteraction: null,
            languageId: 38,
            birthday: "2015-03-23T00:00:00.000Z",
            userLevelId: 1,
            points: 0,
            questionAsked: 14,
            voiceId: 5,
            talkMethod: 'Hold',
            country: null,
            device: 'Other',
            dailyRecap: true,
            dailyRecapMail: false,
            weeklyRecap: false,
            weeklyRecapMail: false,
            feedbackReminder: false,
            trialReminder: false,
            isJoinNewsletter: false,
            joinNewsletterAt: null,
            inviteToken: null,
            inviteTokenExpires: null,
            loginPin: null,
            loginToken: null,
            loginTokenExpires: null,
            inviteLinkId: null,
            account: {
                id: 76,
                createdAt: "2023-03-14T04:53:47.515Z",
                updatedAt: "2023-03-14T04:53:47.515Z",
                status: 1,
                customerId: 'cus_NWSn9RzGhvWsQx',
                email: 'joan.ilari+pin32@mediatropy.com',
                canonicalEmail: 'joan.ilari+pin32@mediatropy.com',
                name: 'Joan Ilari Civit',
                currency: 'usd',
                paymentSource: 'STRIPE',
                subscriptionDefaultPaymentMethod: 'pm_1MlPrnLkfenXMQDERlIrjwGc',
                subscriptionCreatedAt: "2023-03-14T04:53:43.000Z",
                subscriptionId: 'sub_1MlProLkfenXMQDErT14OGYj',
                subscriptionStatus: 'active',
                subscriptionCurrentPeriodStart: "2023-03-14T04:53:43.000Z",
                subscriptionCurrentPeriodEnd: "2023-04-14T04:53:43.000Z",
                cancel_at: "2023-04-14T04:53:43.000Z",
                cancel_at_period_end: true,
                canceled_at: "2023-03-23T04:32:13.000Z",
                productId: 1
            },
            Language: {
                id: 38,
                createdAt: "2023-02-16T02:19:18.955Z",
                updatedAt: "2023-02-16T02:19:18.955Z",
                iso: 'en',
                name: 'English'
            },
            Voice: {
                id: 5,
                voice_code: 'fr-FR',
                voice_name: 'fr-FR-Standard-A',
                voice_public_made: true,
                language_code: 'fr',
                default: true,
                image: 'French'
            },
            age: 9
        },
        message: 'what is my name?'
    }

    let result = await templateHelper.replacePlaceholders(template, data);
    console.log(result)

}
sendMailchimpEmail();