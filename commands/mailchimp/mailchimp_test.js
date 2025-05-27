require('dotenv-safe').config({allowEmptyValues: true});
const mailchimp = require("@mailchimp/mailchimp_transactional")(
    process.env.MANDRILL_API_KEY
);

// const message = {
//     from_email: "hello@hi-eureka.com",
//     subject: "Test",
//     text: "Test email",
//     to: [
//         {
//             email: "joan.ilari@mediatropy.com",
//             type: "to"
//         }
//     ]
// };
//
// async function run() {
//     const response = await mailchimp.messages.send({
//         message
//     });
//     console.log(response);
// }
// run();

async function run() {
    const response = await mailchimp.messages.sendTemplate({
        template_name: "test-1",
        template_content: [{}],
        message: {
            from_email: process.env.MANDRILL_FROM_EMAIL,
            from_name: "Hi Eureka",
            subject: "Test",
            to: [
                {
                    email: "joan.ilari@mediatropy.com",
                    type: "to"
                }
            ],
            global_merge_vars: [
                {
                    name: 'name',
                    content: 'Farhan',
                },
                {
                    name: 'CURRENT_YEAR',
                    content: '1998',
                },
                {
                    name: 'LIST_COMPANY',
                    content: 'Mediatropy',
                },
            ],
        },
    });
    console.log(response);
}

run();

