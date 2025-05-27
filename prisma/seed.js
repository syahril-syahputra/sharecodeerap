const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


async function main() {
    const language = await prisma.language.upsert({
        where: {},
        update: {},
        create: {
            name: 'English',
            iso: 'en',
        },
    })
    console.log(language)
};

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
})