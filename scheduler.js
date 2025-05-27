const Graceful = require('@ladjs/graceful');
const Bree = require('bree');
const path = require('path');

const bree = new Bree({

    jobs: [
        {
            name: 'dailyrecap',
            //“At everyday on 7 - 8pm every 15 minutes.”
            cron: '* 23 * * *', //should have to be `0,15,30,45,59 9-10 * * *` 
            path: path.join(__dirname, 'jobs', 'daily-recap.js')
        },
        // {
        //     name: 'weeklyrecap',
        //     //“on sunday at 7 - 8pm.”
        //     cron: '3 19-20 * * 0', // should have to be `0,15,30,45,59 9 * * 1`
        //     path: path.join(__dirname, 'jobs', 'weekly-recap.js')
        // },
        {
            name: 'update-daily-user-recap',
            //“everyday at 11:05pm.”
            cron: '* 1 * * *', 
            path: path.join(__dirname, 'jobs', 'update-user-dailyrecap.js')
        },
        // {
        //     name: 'update-weekly-user-recap',
        //     //“on sunday at 11:05 pm.”
        //     cron: '* 1 * * 0', // still need to adjust the time
        //     path: path.join(__dirname, 'jobs', 'update-user-weeklyrecap.js')
        // },
        // {
        //     name: 'weekly-user-summary',
        //     //“At Sunday 9am.”
        //     cron: '* 9 * * 6', // still need to adjust the time
        //     path: path.join(__dirname, 'jobs', 'weekly-summary.js')
        // },
        // {
        //     name: 'monthly-user-summary',
        //     //“ON date 1 in every month at 9am.”
        //     cron: '59 23 28-31 * *', // still need to adjust the time
        //     path: path.join(__dirname, 'jobs', 'monthly-summary.js')
        // },
        {
            name: 'waitlist-reminder',
            //“At everyday on midnight”
            cron: '* 9 * * *',
            // interval: '5s',
            path: path.join(__dirname, 'jobs', 'waitlist-reminder.js')
        },
        {
            name: 'newsletter-reminder',
            //“At everyday on midnight”
            cron: '* 9 * * *',
            path: path.join(__dirname, 'jobs', 'newsletter-reminder.js')
        },
        {
            name: 'trial-reminder',
            //“At everyday on midnight”
            cron: '* 9 * * *',
            path: path.join(__dirname, 'jobs', 'trial-reminder.js')
        },
        {
            name: 'feedback-reminder',
            //“At everyday on 9 am”
            cron: '* 9 * * *',
            path: path.join(__dirname, 'jobs', 'feedback-reminder.js')
        },
    ],
    workerMessageHandler: (message) => {
        console.log(message);
    }
})

const graceful = new Graceful({brees: [bree]});
graceful.listen();
bree.start();