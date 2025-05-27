(async () => {
    require("dotenv-safe").config({ allowEmptyValues: true });

    const { PrismaClient, OpenAiVoiceType } = require("@prisma/client");
    const prisma = new PrismaClient();

    console.log(
        await prisma.openAiTTSModel.createMany({
            data: [
                {
                    voice: OpenAiVoiceType.ALLOY,
                },
                {
                    voice: OpenAiVoiceType.ECHO,
                },
                {
                    voice: OpenAiVoiceType.FABLE,
                },
                {
                    voice: OpenAiVoiceType.NOVA,
                },
                {
                    voice: OpenAiVoiceType.ONYX,
                },
                {
                    voice: OpenAiVoiceType.SHIMMER,
                },
            ],
        })
    );
})();
