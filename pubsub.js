require("dotenv-safe").config({ allowEmptyValues: true });
const request = require("request");

const Redis = require("ioredis");
const redis = new Redis({
    host: process.env.REDISHOST,
    port: process.env.REDISPORT,
    password: process.env.REDISPASS,
    showFriendlyErrorStack: true,
});

const postToMattermost = async (formData) => {
    const options = {
        url: process.env.MATTERMOST_URL + "/api/v4/posts",
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.MATTERMOST_SK}`,
        },
        body: JSON.stringify(formData),
    };
    request.post(options, function (error, response, body) {
        if (error) {
            console.error(error);
            // res.status(500).json({ error: 'Internal Server Error' });
        } else if (response.statusCode !== 201) {
            console.error(body);
            // res.status(400).json({ error: 'Bad Request' });
        } else {
            // console.log(body);
            // console.log(message)
            // res.status(200).json({ success: message });
        }
    });
};

redis.subscribe(
    "mattermost:userquiz",
    "mattermost:usertrivia",
    "mattermost:userstories",
    "mattermost:userquestion",
    "mattermost:userpredefinedquestion",
    "mattermost:crashlytics",
    "mattermost:usererror",
    "mattermost:userpayment",
    "mattermost:usercancelation",
    "mattermost:onboardingemail",
    "mattermost:userregistration",
    "mattermost:userfreetrialexpired",
    "mattermost:userfreetrialupgrade",
    "mattermost:userupgradeplan",
    "mattermost:userlevelup",
    "mattermost:usernewregistration",
    "mattermost:userdeleteaccount",
    "mattermost:userloggedin",
    "mattermost:userloggedout",
    "mattermost:useractivedaily",
    "mattermost:userdeactivedaily",
    "mattermost:userchangelanguage",
    "mattermost:userreachmaxtokens",
    "mattermost:userchangetalkmethod",
    "mattermost:userexpirationupdate",
    "mattermost:useropenedapp",
    "mattermost:usergenerateemoji",
    "mattermost:dalle",
    (err, count) => {
        if (err) {
            console.error("Failed to subscribe: %s", err.message);
        } else {
            console.log(
                `Subscribed successfully! currently subscribed to ${count} channels.`
            );
        }
    }
);

redis.on("message", async (channel, message) => {
    try {
        console.log("message incoming to channel" + channel);
        let userEmail;
        let payload;
        switch (channel) {
            //! GPT Request
            case "mattermost:userquiz":
                console.log(
                    `Received data ${message} from mattermost:userquiz`
                );
                payload = JSON.parse(message);
                userEmail = payload.userEmail;
                const { topic: topicQuiz } = payload;
                const formData8 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: userEmail + " play Quiz: " + topicQuiz,
                };

                await postToMattermost(formData8);
                break;
            case "mattermost:usertrivia":
                console.log(
                    `Received data ${message} from mattermost:usertrivia`
                );
                payload = JSON.parse(message);
                userEmail = payload.userEmail;
                const { topic: triviaTopic } = payload;
                const formData9 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: userEmail + " play Trivia: " + triviaTopic,
                };

                await postToMattermost(formData9);
                break;
            case "mattermost:userstories":
                console.log(
                    `Received data ${message} from mattermost:userstories`
                );
                payload = JSON.parse(message);
                userEmail = payload.userEmail;
                const { topic } = payload;
                const formData10 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: userEmail + " used Stories: " + topic,
                };

                await postToMattermost(formData10);
                break;
            case "mattermost:userquestion":
                console.log(
                    `Received data ${message} from mattermost:userquestion`
                );

                payload = JSON.parse(message);

                const qUserEmail = payload.user.email;
                let question = payload.question;
                let answer = payload.answer;
                const formData = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: qUserEmail + " asked: " + question + "\n" + answer,
                };

                await postToMattermost(formData);
                break;
            case "mattermost:userpredefinedquestion":
                console.log(
                    `Received data ${message} from mattermost:userpredefinedquestion`
                );
                payload = JSON.parse(message);
                userEmail = payload.userEmail;
                const { topic: topicPredefined, predefinedQuestion } = payload;
                const formData21 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message:
                        userEmail +
                        " used Predefined Question: " +
                        topicPredefined +
                        " : " +
                        predefinedQuestion,
                };

                await postToMattermost(formData21);
                break;

            //! Error Logs

            case "mattermost:crashlytics":
                console.log(
                    `Received data ${message} from mattermost:crashlytics`
                );
                payload = JSON.parse(message);

                const formData6 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: payload.message,
                };

                await postToMattermost(formData6);
                break;
            case "mattermost:usererror":
                console.log(
                    `Received data ${message} from mattermost:usererror`
                );

                payload = JSON.parse(message);

                userEmail = payload.user.email;
                let error = payload.error;
                const formData2 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: userEmail + " had an error: " + error,
                };

                await postToMattermost(formData2);
                break;

            //! User Billing section

            case "mattermost:userpayment":
                console.log(
                    `Received data ${message} from mattermost:userpayment`
                );
                payload = JSON.parse(message);
                userEmail = payload.user.email;

                let payloadMessage = userEmail + " changed plan to " + payload.plan

                if (payload.isFreetrial) {
                    payloadMessage += payload.isFreetrial
                }
                payloadMessage += " - Payment Source: " + payload.paymentSource

                const formData3 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: payloadMessage
                };

                await postToMattermost(formData3);
                break;
            case "mattermost:userexpirationupdate":
                console.log(
                    `Received data ${message} from mattermost:userexpirationupdate`
                );
                payload = JSON.parse(message);

                const formData25 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: payload.message,
                };

                await postToMattermost(formData25);
                break;
            case "mattermost:usercancelation":
                console.log(
                    `Received data ${message} from mattermost:usercancelation`
                );
                payload = JSON.parse(message);
                userEmail = payload.user.email;

                const formData4 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message:
                        userEmail +
                        " Unsubscribed from " +
                        payload.plan +
                        " - Payment Source: " +
                        payload.paymentSource,
                };

                await postToMattermost(formData4);
                break;
            case "mattermost:onboardingemail":
                console.log(
                    `Received data ${message} from mattermost:onboardingemail`
                );
                payload = JSON.parse(message);
                userEmail = payload.email;

                const formData5 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: "New email recorded from onboarding: " + userEmail,
                };

                await postToMattermost(formData5);
                break;
            case "mattermost:userregistration":
                console.log(
                    `Received data ${message} from mattermost:userregistration`
                );
                payload = JSON.parse(message);

                const formData7 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: payload.message,
                };

                await postToMattermost(formData7);
                break;
            case "mattermost:userfreetrialexpired":
                console.log(
                    `Received data ${message} from mattermost:userfreetrialexpired`
                );
                payload = JSON.parse(message);

                const formData11 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: payload.message,
                };

                await postToMattermost(formData11);
                break;
            case "mattermost:userfreetrialupgrade":
                console.log(
                    `Received data ${message} from mattermost:userfreetrialupgrade`
                );
                payload = JSON.parse(message);

                const formData23 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: payload.message,
                };

                await postToMattermost(formData23);
                break;
            case "mattermost:userupgradeplan":
                console.log(
                    `Received data ${message} from mattermost:userupgradeplan`
                );
                payload = JSON.parse(message);

                const formData24 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: payload.message,
                };

                await postToMattermost(formData24);
                break;

            //! User identity

            case "mattermost:userlevelup":
                console.log(
                    `Received data ${message} from mattermost:userlevelup`
                );
                payload = JSON.parse(message);

                const formData12 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: payload.message,
                };

                await postToMattermost(formData12);
                break;
            case "mattermost:usernewregistration":
                console.log(
                    `Received data ${message} from mattermost:usernewregistration`
                );
                payload = JSON.parse(message);

                const formData22 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: payload.message,
                };

                await postToMattermost(formData22);
                break;
            case "mattermost:userdeleteaccount":
                console.log(
                    `Received data ${message} from mattermost:userdeleteaccount`
                );
                payload = JSON.parse(message);

                const formData13 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: payload.message,
                };

                await postToMattermost(formData13);
                break;
            case "mattermost:userloggedin":
                console.log(
                    `Received data ${message} from mattermost:userloggedin`
                );
                payload = JSON.parse(message);

                const formData14 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: payload.message,
                };

                await postToMattermost(formData14);
                break;
            case "mattermost:userloggedout":
                console.log(
                    `Received data ${message} from mattermost:userloggedout`
                );
                payload = JSON.parse(message);

                const formData15 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: payload.message,
                };

                await postToMattermost(formData15);
                break;
            case "mattermost:useractivedaily":
                console.log(
                    `Received data ${message} from mattermost:useractivedaily`
                );
                payload = JSON.parse(message);

                const formData16 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: payload.message,
                };

                await postToMattermost(formData16);
                break;
            case "mattermost:userdeactivedaily":
                console.log(
                    `Received data ${message} from mattermost:userdeactivedaily`
                );
                payload = JSON.parse(message);

                const formData17 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: payload.message,
                };

                await postToMattermost(formData17);
                break;
            case "mattermost:userchangelanguage":
                console.log(
                    `Received data ${message} from mattermost:userchangelanguage`
                );
                payload = JSON.parse(message);

                const formData18 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: payload.message,
                };

                await postToMattermost(formData18);
                break;
            case "mattermost:userreachmaxtokens":
                console.log(
                    `Received data ${message} from mattermost:userreachmaxtokens`
                );
                payload = JSON.parse(message);

                const formData19 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: payload.message,
                };

                await postToMattermost(formData19);
                break;
            case "mattermost:userchangetalkmethod":
                console.log(
                    `Received data ${message} from mattermost:userchangetalkmethod`
                );
                payload = JSON.parse(message);

                const formData20 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: payload.message,
                };

                await postToMattermost(formData20);
                break;

            case "mattermost:useropenedapp":
                console.log(
                    `Received data ${message} from mattermost:useropenedapp`
                );
                payload = JSON.parse(message);

                const formData26 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: payload.message,
                };

                await postToMattermost(formData26);
                break;

            case "mattermost:usergenerateemoji":
                console.log(
                    `Received data ${message} from mattermost:usergenerateemoji`
                );
                payload = JSON.parse(message);

                const formData261 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: payload.message,
                };

                await postToMattermost(formData261);
                break;
            case "mattermost:dalle":
                console.log(
                    `Received data ${message} from mattermost:dalle`
                );
                payload = JSON.parse(message);
                let mes = `User ${payload.userEmail} generated an Image using Dalle3 with the concept ${payload.concept}, the image is ${payload.image}`;

                const formData27 = {
                    channel_id: process.env.MATTERMOST_CHANNEL_ID,
                    message: mes,
                };

                await postToMattermost(formData27);
                break;
        }
    } catch (e) {
        console.error(e);
        // Sentry.captureException(e);
    }
});
