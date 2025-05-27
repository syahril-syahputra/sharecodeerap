require('dotenv-safe').config({allowEmptyValues : true});
var AWS = require('aws-sdk');
var ejs = require('ejs');

const AWS_SES = new AWS.SES(
    {
        region: 'us-east-1'
    });

let sendEmail = (subject, recipientEmails, body) => {
    let params = {
        Source: 'support@mediatropy.com',
        Destination: {
            ToAddresses: recipientEmails,
        },
        ReplyToAddresses: [],
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: body,
                },
            },
            Subject: {
                Charset: 'UTF-8',
                Data: subject,
            }
        },
    };

    return AWS_SES.sendEmail(params).promise();
};

let sendLocalTemplateEmail = async (subject, recipientEmails, template, templateParams) => {

    let result = await ejs.renderFile(process.cwd() + '/templates/email/' + template, templateParams, {});
    try {
        let params = {
            Source: 'support@mediatropy.com',
            Destination: {
                ToAddresses: recipientEmails,
            },
            ReplyToAddresses: [],
            Message: {
                Body: {
                    Html: {
                        Charset: 'UTF-8',
                        Data: result,
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: subject,
                }
            },
        };

        return await AWS_SES.sendEmail(params).promise();

    } catch (err) {
        console.error(err, err.stack);
    }

};

module.exports = {sendEmail, sendLocalTemplateEmail};