const prisma = require("../../libs/lib-prisma");

const create = async () => {
    const res = await prisma.settings.create({
        data : {
            name : "StripeVisibility",
            status: false
        }
    })
    console.log(res)
}

create()