const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const Sentry = require("@sentry/node");
const { parentPort } = require('worker_threads');
var dayjs = require('dayjs');
const createFileTxt = require('../libs/helpers/generateTxt');

(async () => {

    console.log(`## Update Daily Recap for user`);

    const dailyRecap = await prisma.user.updateMany({
        where:  {
            dailyRecap : true
        },
        data : {
            dailyRecapMail : false
        }
    })

    if(parentPort) parentPort.postMessage('done')
    else process.exit(0)
})();