const Sentry = require("@sentry/node");
const mailchimp = require("@mailchimp/mailchimp_transactional")(
    process.env.MANDRILL_API_KEY
);

const subjectIndicator = () => {
    let txt;
    if(process.env.ENVIRONMENT == 'dev') txt = '[DEV]'
    else if(process.env.ENVIRONMENT == 'prod') txt = ''
    return txt || '';
}

const mailchimpEmailService = {
    sendNewDailyRecapEmail: async (email, name, date, dailyRecap, suggestion) => {
        const response = await mailchimp.messages.sendTemplate({
            template_name: "new-daily-recap",
            template_content: [{}],
            message: {
                from_email: process.env.MANDRILL_FROM_EMAIL,
                from_name: "Hi Eureka!",
                subject: subjectIndicator() + `Daily Recap for ${name}`,
                to: [
                    {
                        email: email,
                        type: "to"
                    }
                ],
                global_merge_vars: [
                    {
                        name: 'NAME',
                        content: name ? name : "User"
                    },
                    {
                        name: 'date' ,
                        content: `${date}`,
                    },
                    {
                        name: 'dailyRecap' ,
                        content: `${dailyRecap}`,
                    },
                    {
                        name: 'suggestion' ,
                        content: `${suggestion}`,
                    }
                ],
                // attachments : [
                //     attachments
                // ]
            },
        });
        console.log(response)

        if (!response) {
            Sentry.captureException("Failed to send Daily Recap Email");
        }
    },
    sendDailyRecapEmail: async (email, name, date, totalQuestion, totalQuiz, totalStories, attachments) => {
        const response = await mailchimp.messages.sendTemplate({
            template_name: "daily-email-recap",
            template_content: [{}],
            message: {
                from_email: process.env.MANDRILL_FROM_EMAIL,
                from_name: "Hi Eureka!",
                subject: subjectIndicator() + `Daily Recap for ${name}`,
                to: [
                    {
                        email: email,
                        type: "to"
                    }
                ],
                global_merge_vars: [
                    {
                        name: 'NAME',
                        content: name ? name : "User"
                    },
                    {
                        name: 'date' ,
                        content: `${date}`,
                    },
                    {
                        name: 'questions' ,
                        content: `${totalQuestion}`,
                    },
                    {
                        name: 'quiz' ,
                        content: `${totalQuiz}`,
                    },
                    {
                        name: 'stories' ,
                        content: `${totalStories}`,
                    },
                    {
                        name: 'CURRENT_YEAR',
                        content: new Date().getFullYear().toString(),
                    },
                    {
                        name: 'LIST_COMPANY',
                        content: 'Hi Eureka!',
                    },
                ],
                attachments : [
                    attachments
                ]
            },
        });

        if (!response) {
            Sentry.captureException("Failed to send Daily Recap Email");
        }
    },

    sendWelcomeToNewsletter: async (email) => {
        const response = await mailchimp.messages.sendTemplate({
            template_name: "1-welcome-to-newsletter-1",
            template_content: [{}],
            message: {
                from_email: process.env.MANDRILL_FROM_EMAIL,
                from_name: "Hi Eureka!",
                subject: subjectIndicator() + "Welcome to our Hi Eureka! Newsletter!",
                to: [
                    {
                        email: email,
                        type: "to"
                    }
                ],
                global_merge_vars: [
                    {
                        name: 'CURRENT_YEAR',
                        content: new Date().getFullYear().toString(),
                    },
                    {
                        name: 'LIST_COMPANY',
                        content: 'Hi Eureka!',
                    },
                ],
            },
        });

        if (!response) {
            Sentry.captureException("Failed to send Daily Recap Email");
        }
    },

    sendTryOurApp: async (email) => {
        const response = await mailchimp.messages.sendTemplate({
            template_name: "2-try-our-app",
            template_content: [{}],
            message: {
                from_email: process.env.MANDRILL_FROM_EMAIL,
                from_name: "Hi Eureka!",
                subject: subjectIndicator() + "Introduce Hi Eureka! to your kids today",
                to: [
                    {
                        email: email,
                        type: "to"
                    }
                ],
                global_merge_vars: [
                    {
                        name: 'CURRENT_YEAR',
                        content: new Date().getFullYear().toString(),
                    },
                    {
                        name: 'LIST_COMPANY',
                        content: 'Hi Eureka!',
                    },
                ],
            },
        });

        if (!response) {
            Sentry.captureException("Failed to send Daily Recap Email");
        }
    },

    sendJoinFreeTrialWaitingList: async (email) => {
        const response = await mailchimp.messages.sendTemplate({
            template_name: "3-join-the-free-trial-waiting-list",
            template_content: [{}],
            message: {
                from_email: process.env.MANDRILL_FROM_EMAIL,
                from_name: "Hi Eureka!",
                subject: subjectIndicator() + "Looking for a free trial? Join our waitlist now",
                to: [
                    {
                        email: email,
                        type: "to"
                    }
                ],
                global_merge_vars: [
                    {
                        name: 'CURRENT_YEAR',
                        content: new Date().getFullYear().toString(),
                    },
                    {
                        name: 'LIST_COMPANY',
                        content: 'Hi Eureka!',
                    },
                ],
            },
        });

        if (!response) {
            Sentry.captureException("Failed to send Daily Recap Email");
        }
    },

    sendWaitlistEmail: async (email) => {
        const response = await mailchimp.messages.sendTemplate({
            template_name: "4-welcome-to-the-waiting-list",
            template_content: [{}],
            message: {
                from_email: process.env.MANDRILL_FROM_EMAIL,
                from_name: "Hi Eureka!",
                subject: subjectIndicator() + "[Free-Trial] Welcome to the waitlist for the free trial!",
                to: [
                    {
                        email: email,
                        type: "to"
                    }
                ],
                global_merge_vars: [
                    {
                        name: 'CURRENT_YEAR',
                        content: new Date().getFullYear().toString(),
                    },
                    {
                        name: 'LIST_COMPANY',
                        content: 'Hi Eureka!',
                    },
                ],
            },
        });

        if (!response) {
            Sentry.captureException("Failed to send Waitlist Email");
        }
    },

    sendInvitedToFreeTrial: async (email, link) => {
        const response = await mailchimp.messages.sendTemplate({
            template_name: "5-invited-to-free-trial",
            template_content: [{}],
            message: {
                from_email: process.env.MANDRILL_FROM_EMAIL,
                from_name: "Hi Eureka!",
                subject: subjectIndicator() + "[Free-Trial] It's your turn now!",
                to: [
                    {
                        email: email,
                        type: "to"
                    }
                ],
                global_merge_vars: [
                    {
                        name: 'LOGINLINK',
                        content: link,
                    },
                    {
                        name: 'CURRENT_YEAR',
                        content: new Date().getFullYear().toString(),
                    },
                    {
                        name: 'LIST_COMPANY',
                        content: 'Hi Eureka!',
                    },
                ],
            },
        });

        if (!response) {
            Sentry.captureException("Failed to send Daily Recap Email");
        }
    },

    sendInvitationExpiredTomorrow: async (email, link) => {
        const response = await mailchimp.messages.sendTemplate({
            template_name: "6-your-invitation-expires-tomorrow",
            template_content: [{}],
            message: {
                from_email: process.env.MANDRILL_FROM_EMAIL,
                from_name: "Hi Eureka!",
                subject: subjectIndicator() + `[Free Trial] Your invitation expires today!`,
                to: [
                    {
                        email: email,
                        type: "to"
                    }
                ],
                global_merge_vars: [
                    {
                        name: 'LOGINLINK',
                        content: link
                    },
                    {
                        name: 'CURRENT_YEAR',
                        content: new Date().getFullYear().toString(),
                    },
                    {
                        name: 'LIST_COMPANY',
                        content: 'Hi Eureka!',
                    },
                ],
            },
        });

        if (!response) {
            Sentry.captureException("Failed to send Daily Recap Email");
        }
    },

    sendInvitationExpiredAlready: async (email) => {
        const response = await mailchimp.messages.sendTemplate({
            template_name: "7-your-invitation-expired-already",
            template_content: [{}],
            message: {
                from_email: process.env.MANDRILL_FROM_EMAIL,
                from_name: "Hi Eureka!",
                subject: subjectIndicator() + `[Free Trial] Your invitation expired! Upgrade to a Paid Membership Today!`,
                to: [
                    {
                        email: email,
                        type: "to"
                    }
                ],
                global_merge_vars: [
                    {
                        name: 'CURRENT_YEAR',
                        content: new Date().getFullYear().toString(),
                    },
                    {
                        name: 'LIST_COMPANY',
                        content: 'Hi Eureka!',
                    },
                ],
            },
        });

        if (!response) {
            Sentry.captureException("Failed to send Daily Recap Email");
        }
    },

    sendWelcomeToFreeTrial: async (email) => {
        const response = await mailchimp.messages.sendTemplate({
            template_name: "free-trial-welcome-here-are-some-learning-topic",
            template_content: [{}],
            message: {
                from_email: process.env.MANDRILL_FROM_EMAIL,
                from_name: "Hi Eureka!",
                subject: subjectIndicator() + "[Free-Trial] Welcome! Here are some learning topics ideas!",
                to: [
                    {
                        email: email,
                        type: "to"
                    }
                ],
                global_merge_vars: [
                    {
                        name: 'CURRENT_YEAR',
                        content: new Date().getFullYear().toString(),
                    },
                    {
                        name: 'LIST_COMPANY',
                        content: 'Hi Eureka!',
                    },
                ],
            },
        });

        if (!response) {
            Sentry.captureException("Failed to send Daily Recap Email");
        }
    },

    sendFeedbackEmail: async (email, name) => {
        const response = await mailchimp.messages.sendTemplate({
            template_name: "9-12-can-we-get-your-feedback-hope-you-are-ok",
            template_content: [{}],
            message: {
                from_email: process.env.MANDRILL_FROM_EMAIL,
                from_name: "Hi Eureka!",
                subject: subjectIndicator() + "Help Us Shape Hi Eureka for You!",
                to: [
                    {
                        email: email,
                        type: "to"
                    }
                ],
                global_merge_vars: [
                    {
                        name: 'NAME',
                        content: name ? name : "User",
                    },
                    {
                        name: 'CURRENT_YEAR',
                        content: new Date().getFullYear().toString(),
                    },
                    {
                        name: 'LIST_COMPANY',
                        content: 'Hi Eureka!',
                    },
                ],
            },
        });

        if (!response) {
            Sentry.captureException("Failed to send Daily Recap Email");
        }
    },

    sendWelcomeAsPaidUser: async (email, name) => {
        const response = await mailchimp.messages.sendTemplate({
            template_name: "10-welcome-as-a-paid-user",
            template_content: [{}],
            message: {
                from_email: process.env.MANDRILL_FROM_EMAIL,
                from_name: "Hi Eureka!",
                subject: subjectIndicator() + "[Subscriber] Welcome as our new customer!",
                to: [
                    {
                        email: email,
                        type: "to"
                    }
                ],
                global_merge_vars: [
                    {
                        name: 'NAME',
                        content: name ? name : 'User'
                    },
                    {
                        name: 'CURRENT_YEAR',
                        content: new Date().getFullYear().toString(),
                    },
                    {
                        name: 'LIST_COMPANY',
                        content: 'Hi Eureka!',
                    },
                ],
            },
        });

        if (!response) {
            Sentry.captureException("Failed to send Daily Recap Email");
        }
    },

    sendWhatDidWeDoWrong: async (email, name) => {
        const response = await mailchimp.messages.sendTemplate({
            template_name: "11-what-did-we-do-wrong",
            template_content: [{}],
            message: {
                from_email: process.env.MANDRILL_FROM_EMAIL,
                from_name: "Hi Eureka!",
                subject: subjectIndicator() +"[Cancel] Sorry to see you go... Can you tell us why?",
                to: [
                    {
                        email: email,
                        type: "to"
                    }
                ],
                global_merge_vars: [
                    {
                        name: 'NAME',
                        content: name ? name : ""
                    },
                    {
                        name: 'CURRENT_YEAR',
                        content: new Date().getFullYear().toString(),
                    },
                    {
                        name: 'LIST_COMPANY',
                        content: 'Hi Eureka!',
                    },
                ],
            },
        });

        if (!response) {
            Sentry.captureException("Failed to send Daily Recap Email");
        }
    },

    sendWelcomeToNewPlan: async (email, name, plan) => {
        const response = await mailchimp.messages.sendTemplate({
            template_name: "14-15-welcome-to-your-new-plan",
            template_content: [{}],
            message: {
                from_email: process.env.MANDRILL_FROM_EMAIL,
                from_name: "Hi Eureka!",
                subject: subjectIndicator() + "[Subscriber] Welcome to your new plan",
                to: [
                    {
                        email: email,
                        type: "to"
                    }
                ],
                global_merge_vars: [
                    {
                        name: 'NAME',
                        content: name ? name : "",
                    },
                    {
                        name: 'PLAN_NAME',
                        content: plan ? plan : ""
                    },
                    {
                        name: 'CURRENT_YEAR',
                        content: new Date().getFullYear().toString(),
                    },
                    {
                        name: 'LIST_COMPANY',
                        content: 'Hi Eureka!',
                    },
                ],
            },
        });

        if (!response) {
            Sentry.captureException("Failed to send Daily Recap Email");
        }
    },


    sendLoginEmail: async (email, name, pin) => {
        const response = await mailchimp.messages.sendTemplate({
            template_name: "17-pin-reminder-change",
            template_content: [{}],
            message: {
                from_email: process.env.MANDRILL_FROM_EMAIL,
                from_name: "Hi Eureka!",
                subject: subjectIndicator() + "Your PIN",
                to: [
                    {
                        email: email,
                        type: "to"
                    }
                ],
                global_merge_vars: [
                    {
                        name: 'name',
                        content: name ? name : "",
                    },
                    {
                        name: 'pin' ,
                        content: `${pin}`,
                    },
                    {
                        name: 'CURRENT_YEAR',
                        content: new Date().getFullYear().toString(),
                    },
                    {
                        name: 'LIST_COMPANY',
                        content: 'Hi Eureka!',
                    },
                ],
            },
        });

        if (!response) {
            Sentry.captureException("Failed to send Login Details Email");
        }
    },


    sendInvitePeople: async (email, name) => {
        const response = await mailchimp.messages.sendTemplate({
            template_name: "18-invite-people-to-eureka",
            template_content: [{}],
            message: {
                from_email: process.env.MANDRILL_FROM_EMAIL,
                from_name: "Hi Eureka!",
                subject: subjectIndicator() + "Join Hi Eureka!",
                to: [
                    {
                        email: email,
                        type: "to"
                    }
                ],
                global_merge_vars: [
                    {
                        name: 'NAME',
                        content: name ? name : "",
                    },
                    {
                        name: 'EMAIL',
                        content: email,
                    },
                    {
                        name: 'CURRENT_YEAR',
                        content: new Date().getFullYear().toString(),
                    },
                    {
                        name: 'LIST_COMPANY',
                        content: 'Hi Eureka!',
                    },
                ],
            },
        });

        if (!response) {
            Sentry.captureException("Failed to send Login Details Email");
        }
    },

}
module.exports = mailchimpEmailService;