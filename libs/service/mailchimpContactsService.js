const Sentry = require("@sentry/node");
const mailchimp = require("@mailchimp/mailchimp_marketing");
const {WaitlistType} = require("@prisma/client");
const mailchimpHasher = require("../helpers/mailchimp");

mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER,
});

// Mailchimp all contacts list
const listId = {
    waitlist: "63c3b55ce7",
    user: "b735222170",
    account: "7808db28d9"
}

const mailchimpContactsService = {

    // Waitlist users

    createWaitlistContact: async (email) => {
        const response = await mailchimp.lists.addListMember(listId.waitlist, {
            email_address: email,
            status: "subscribed",
            merge_fields: {
                WAITLISTAT: new Date(),
                WAITSTATUS: WaitlistType.NOT_INVITED.toString(),
            }
        });

    },

    editEmailWaitlistContact: async (oldEmail, newEmail) => {
        await mailchimp.lists.updateListMember(
            listId.waitlist,
            mailchimpHasher.generateMD5Hash(oldEmail),
            {
                email_address: newEmail,
                status_if_new: "subscribed",
            }
        );
    },

    deleteWaitlistContact: async (email) => {
        await mailchimp.lists.deleteListMemberPermanent(
            listId.waitlist,
            mailchimpHasher.generateMD5Hash(email)
        );
    },

    inviteWaitlistContact: async (email) => {
        await mailchimp.lists.updateListMember(
            listId.waitlist,
            mailchimpHasher.generateMD5Hash(email),
            {
                email_address: email,
                status_if_new: "subscribed",
                merge_fields: {
                    WAITSTATUS: WaitlistType.INVITED.toString(),
                    INVITEAT: new Date(),
                }
            }
        );
    },
 
    redeemWaitlistContact: async (email) => {
        await mailchimp.lists.updateListMember(
            listId.waitlist,
            mailchimpHasher.generateMD5Hash(email),
            {
                email_address: email,
                status_if_new: "subscribed",
                merge_fields: {
                    WAITSTATUS: WaitlistType.REDEEMED.toString(),
                    REDEEMAT: new Date(),
                }
            }
        );
    },

    createUserAudience: async (email) => {
        const response = await mailchimp.lists.addListMember(listId.user, {
            email_address: email,
            status: "subscribed",
            merge_fields: {
                CREATEDAT: new Date(),
            }
        });


    }, 

    editUserAudience: async (email, firstname, birthday, dailyrecap, language, levelId, freeTrial, planType) => {
        const response = await mailchimp.lists.updateListMember(listId.user,
            mailchimpHasher.generateMD5Hash(email), {
            email_address: email,
            status_if_new: "subscribed",
            merge_fields: {
                FNAME: firstname,
                BIRTHDAY: birthday,
                DAILYRECAP: dailyrecap,
                LANGUAGE: language,
                LEVELID: levelId,
                FREETRIAL: freeTrial,
                PLANTYPE: planType
            }
        });

    },

    createAccountAudience: async (email, name, product, status, cancel_at, canceled_at) => {
        const response = await mailchimp.lists.addListMember(listId.account, {
            email_address: email,
            status: "subscribed",
            merge_fields: {
                FNAME: name,
                CANCELAT: cancel_at,
                RQCANCELAT: canceled_at,
                SUBSTATUS: status,
                PLAN: product,
            }
        })

    },

    updateAccountAudience: async (email, name, product, status, cancel_at, canceled_at) => {
        const response = await mailchimp.lists.updateListMember(listId.account, mailchimpHasher.generateMD5Hash(email), {
            email_address: email,
            status: "subscribed",
            merge_fields: {
                FNAME: name,
                CANCELAT: cancel_at,
                RQCANCELAT: canceled_at,
                SUBSTATUS: status,
                PLAN: product,
            }
        });

    },

    checkAccountAudience: async (email) => {
        const response = await mailchimp.lists.getListMember(
            listId.account,
            mailchimpHasher.generateMD5Hash(email)
        );

        return response.status;
    }

}
module.exports = mailchimpContactsService;
