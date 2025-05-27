const fs = require("fs");
const Sentry = require("@sentry/node");
const dayjs = require('dayjs')
const momentTimezon = require('moment-timezone')
const createFileTxt = async (data, type, locale = 'en', name) => {
    try {
        //Provide locale with moment-timezone to get the locale places that support with dayJS
        // const localeTZ = momentTimezon.locale(locale)
        // require(`dayjs/locale/${localeTZ}`)
        // dayjs.locale(localeTZ)
        //Declare Path for weekly and daily recap
        let pathName;
        if (type === "daily") {
            pathName = "public/daily-recap.txt";
        } else if (type === "weekly") {
            pathName = "public/weekly-recap.txt";
        }
        //Make base sentences
        const date = dayjs().format('dddd DD MMMM YYYY')
        let recap = `${date}\nDaily Recap: \n\n`;

        if(data.length < 1) {
            recap += 'No conversation'
        } else {
            data.forEach(({request, response, createdAt}) => {
                recap += `${dayjs(createdAt).format('dddd DD MMMM YYYY [at] HH:mm')}\n${name}: ${request}\nEureka: ${response}\n${'-'.repeat(20)}\n`
            });          //! im ensure that need to use the mockdata first
        }
        
        fs.writeFileSync(pathName, recap,'utf-8');

        const attachment = fs.readFileSync(pathName, { encoding: "base64" });

        console.log(`Recap saved to file successfully.`);
        return {
            type: "text/plain",
            name: `${type}-recap.txt`,
            content: attachment,
        };
    } catch (e) {
        console.log(e);
        console.error(e);
        Sentry.captureException(e);
    }
};

module.exports = createFileTxt;
