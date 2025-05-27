require('dotenv-safe').config({allowEmptyValues : true});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const models = [
    {model: "gpt-3.5-turbo"},
    {model: "text-davinci-003"},
    {model: "text-curie-001"},
    {model: "text-babbage-001"},
    {model: "text-ada-001"},
    {model: "text-davinci-002"},
    {model: "text-davinci-001"},
    {model: "davinci-instruct-beta"},
    {model: "davinci"},
    {model: "curie-instruct-beta"},
    {model: "curie"},
    {model: "babbage"},
    {model: "ada"},
]

const createEngine = async ()=>{
    models.map(async(soc) => {
        const social = await prisma.engine.create({
            data: soc,
        })
        console.log(social)
    })
}

createEngine();