require('dotenv-safe').config({allowEmptyValues : true});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const userLevels = [
    {tier: 1, name: "Daring Dolphin", points: 100},
    {tier: 2, name: "Brainy Bat", points: 200},
    {tier: 3, name: "Crafty Crocodile", points: 300},
    {tier: 4, name: "Friendly Fox", points: 400},
    {tier: 5, name: "Heroic Hippo", points: 500},
    {tier: 6, name: "Innovative Iguana", points: 600},
    {tier: 7, name: "Jovial Jellyfish", points: 700},
    {tier: 8, name: "Knowledgeable Koala", points: 800},
    {tier: 9, name: "Lively Leopard", points: 900},
    {tier: 10, name: "Magnificent Mongoose", points: 1000},
]

const createUserLevels = async ()=>{
    userLevels.map(async(ul) => {
        const userLevel = await prisma.userLevel.create({
            data: ul,
        })
        console.log(userLevel)
    })
}

createUserLevels();