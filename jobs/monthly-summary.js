const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const Sentry = require("@sentry/node");
const { parentPort } = require('worker_threads');
var dayjs = require('dayjs');
const createFileTxt = require('../libs/helpers/generateTxt');

(async () => {

    console.log(`## Creating Weekly Summary of stories for user`);

    const startDate = dayjs().startOf("month").toDate();
    const endDate = dayjs().endOf("month").toDate();

    console.log(startDate.toISOString())
    console.log(endDate.toISOString())

    if(parentPort) parentPort.postMessage('done')
    else process.exit(0)
})();