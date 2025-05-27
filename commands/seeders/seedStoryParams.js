require("dotenv-safe").config({ allowEmptyValues: true });

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const data = [
    {
        name: "Type Of Story",
    },
    {
        name: "Who",
    },
    {
        name: "When",
    },
    {
        name: "Where",
    },
];

const createParams = async () => {
        const create = await prisma.storyParams.createMany({
            data
        })

        console.log(create)
};

createParams();
