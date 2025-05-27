require('dotenv-safe').config({allowEmptyValues: true});
const mailchimp = require("@mailchimp/mailchimp_marketing");

mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER,
});

const listId = "ef144cce72";

async function run() {
    try {
        const response = await mailchimp.lists.addListMember(listId, {
            email_address: "joan.ilari3@mediatropy.com",
            status: "subscribed",
            merge_fields: {
                FNAME: "Joan",
                LNAME: "Ilari",
                BIRTHDAY: "05/25",
                BIRTHDATE: new Date(),
                WAITLISTAT: new Date(),
                INVITEAT: new Date(),
                REDEEMAT: new Date(),
                WAITSTATUS: "NOT_INVITED",
                CREATEDAT: new Date(),
                CANCELAT: new Date(),
                RQCANCELAT: new Date(),
                DAILYRECAP: "Yes",
                LANGUAGE: "English",
                PLAN: "Heavy",
                SUBSTATUS: "active",
                LEVELID: "1",
            }
        });

        console.log(
            `Successfully added contact as an audience member. The contact's id is ${
                response.id
            }.`
        );
    } catch (e) {
        console.log(e)
    }
}

run();
