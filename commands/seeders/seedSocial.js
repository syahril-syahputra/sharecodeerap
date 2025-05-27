require('dotenv-safe').config({allowEmptyValues : true});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const socials = [
    {name: "Friends"},
    {name: "Website"},
    {name: "Influencer"},
    {name: "Facebook"},
    {name: "Tiktok"},
    {name: "Instagram"},
]

const createSocial = async ()=>{
    socials.map(async(soc) => {
        const social = await prisma.social.create({
            data: soc,
        })
        console.log(social)
    })
}

createSocial();