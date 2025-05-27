require("dotenv-safe").config({ allowEmptyValues: true });

(async () => {
    const { PaymentSource } = require("@prisma/client");

    const prisma = require("../libs/lib-prisma");
    const { default: axios } = require("axios");

    const rawReceipts = await prisma.account.findMany({
        where: {
            appleReceipt: {
                not: null,
            },
            paymentSource: PaymentSource.APPLE
        },

        select: {
            appleReceipt: true,
            id : true
        },
    });

    console.log(receipts, 'Receipt');
    for (let e = 0; e < rawReceipts.length; e++) {
        const el = rawReceipts[e];

        const { data } = await axios.post(
            `https://buy.itunes.apple.com/verifyReceipt`,
            {
                receipt: el.appleReceipt,
                password: process.env.ITUNES,
                "exclude-old-transactions": false,
            }
        );

        console.log(data);
        if(data?.environment !== 'Production') {
            const res = await prisma.account.update({
                where : {
                    id : el.id
                },
                data : {
                    isDev : true
                },
                select :{ 
                    id : true,
                    email : true,
                    isDev : true,
                }
            });

            console.log(res, 'Updated');
        }
    }
})();
