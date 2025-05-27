// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();
// var dayjs = require("dayjs");
// const createFileTxt = require("./libs/helpers/generateTxt");
// const { sendDailyRecapEmail } = require("./libs/service/mailchimpEmailService");

const dayjs = require("dayjs");
const { uploadS3base64 } = require("./libs/service/s3Service");

// const testEmailDaily = async () => {
//     const startDate = dayjs().startOf("day").toDate();
//     const endDate = dayjs().endOf("day").toDate();
//     const email = "pierre+stripe1206@deluca.fr";
//     const user = await prisma.user.findFirst({
//         where: {
//             email,
//         },
//         select: {
//             id: true,
//         },
//     });
//     const { id } = user;

//     const prompt = await prisma.prompt.findMany({
//         where: {
//             userId: id,
//             type: "DEFAULT",
//             createdAt: {
//                 gte: startDate,
//                 lte: endDate,
//             },
//         },
//         select: {
//             response: true,
//             request: true,
//             createdAt: true,
//         },
//     });
//     const defaultPrompt = await prisma.prompt.count({
//         where: {
//             userId: id,
//             type: "DEFAULT",
//             createdAt: {
//                 gte: startDate,
//                 lt: endDate,
//             },
//         },
//     });
//     const quiz = await prisma.quiz.count({
//         where: {
//             userId: id,
//             createdAt: {
//                 gte: startDate,
//                 lt: endDate,
//             },
//         },
//     });
//     const stories = await prisma.prompt.count({
//         where: {
//             userId: id,
//             type: "STORY",
//             createdAt: {
//                 gte: startDate,
//                 lt: endDate,
//             },
//         },
//     });

//     const updateUser = await prisma.user.update({
//         where : {
//             id : id
//         },
//         data : {
//             dailyRecap : true
//         },
//         select : {
//             Language : true,
//             email : true,
//             firstname: true
//         }
//     });

//     const { Language, firstname } = updateUser
//     const { iso:locale } = Language
//     const attachmentsTxt = await createFileTxt(prompt, 'daily', undefined, firstname);
//     const date = dayjs().format('dddd DD MMMM YYYY')
//     const sendEmail = await sendDailyRecapEmail(email,firstname, date, defaultPrompt, quiz, stories, attachmentsTxt)
// };

// testEmailDaily()

// (async () => {
//     const prisma = require("./libs/lib-prisma");
//     function dynamicWhereClause(conditions) {
//         const where = {
//             AND: conditions.map((condition) => {
//                 const { field, condition: op, value } = condition;
//                 if (op === "startsWith") {
//                     return { [field]: { startsWith: value } };
//                 } else if (op === "at") {
//                     return { [field]: value };
//                 } else if (op === "gte") {
//                     return { [field]: { gte: new Date(value) } };
//                 } else if (op === "lte") {
//                     return { [field]: { lte: new Date(value) } };
//                 } else if (op === "endsWith") {
//                     return { [field]: { startsWith: value } };
//                 } else if (op === "contain") {
//                     return { [field]: { contains: value } };
//                 } else {
//                     return { [field]: value };
//                 }
//             }),
//         };
//         return where;
//     }
//     const where = dynamicWhereClause([
//         {
//             field: "email",
//             condition: "startsWith",
//             value: "a",
//         },
//         {
//             field: "isAdmin",
//             value: true,
//         },
//         {
//             field: "languageId",
//             value: 66,
//         },
//         {
//             field: "createdAt",
//             condition: "lte",
//             value: "2023-10-30T17:00:00.000Z",
//         },
//     ]);
//     // console.log(Object.keys(where).map(e => {
//     //     console.log(e, where[e])
//     // }));
//     console.log(where)
//     console.log(await prisma.user.findMany({
//         where : where
//     }))

// })();

// console.log(dayjs().startOf('day').toDate())
// console.log(dayjs().endOf('day').toDate())
require("dotenv-safe").config({ allowEmptyValues: true });
// const fs = require("fs");
// const OpenAI = require("openai");
// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_SECRET_KEY,
// });

// const test = (async () => {
//     const response = await openai.audio.translations.create({
//         model : "whisper-1",
//         file : fs.createReadStream("./test.mp3"),
//     })
//     console.log(response);
// })();
const fs = require("fs");
const upload = async () => {
    try {
        const data = fs.readFileSync("./public/email_signature.gif",'base64');
        const up = await uploadS3base64(data, "email/email_signature.gif");
        console.log(up);
    } catch (e) {
        console.error(e);
        console.log(e.message);
    }
};

upload().then(console.log).catch(console.error)
// console.log(fs.readFileSync('./public/appstore.png','base64'));
