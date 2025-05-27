require('dotenv-safe').config({allowEmptyValues : true});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const voiceModelLanguages = [
    {
        language_code : 'fr',
        voice_name : 'fr-CA-Standard-A',
        voice_code : 'fr-CA',
        voice_public_made : true,
        default : false,
        image : 'french'
    },
    {
        language_code : 'fr',
        voice_name : 'fr-CA-Standard-B',
        voice_code : 'fr-CA',
        voice_public_made : true,
        default : false,
        image : 'French'
    },
    {
        language_code : 'fr',
        voice_name : 'fr-CA-Standard-C',
        voice_code : 'fr-CA',
        voice_public_made : true,
        default : false,
        image : 'French'
    },
    {
        language_code : 'fr',
        voice_name : 'fr-CA-Standard-D',
        voice_code : 'fr-CA',
        voice_public_made : true,
        default : false,
        image : 'French'
    },
    {
        language_code : 'fr',
        voice_name : 'fr-FR-Standard-A',
        voice_code : 'fr-FR',
        voice_public_made : true,
        default : false,
        image : 'French'
    },
    {
        language_code : 'fr',
        voice_name : 'fr-FR-Standard-B',
        voice_code : 'fr-FR',
        voice_public_made : true,
        default : false,
        image : 'French'
    },
    {
        language_code : 'fr',
        voice_name : 'fr-FR-Standard-C',
        voice_code : 'fr-FR',
        voice_public_made : true,
        default : false,
        image : 'French'
    },
    {
        language_code : 'fr',
        voice_name : 'fr-FR-Standard-D',
        voice_code : 'fr-FR',
        voice_public_made : true,
        default : false,
        image : 'French'
    },
    {
        language_code : 'fr',
        voice_name : 'fr-FR-Standard-E',
        voice_code : 'fr-FR',
        voice_public_made : true,
        default : false,
        image : 'French'
    },
    {
        language_code : 'fr',
        voice_name : 'fr-CA-Wavenet-A',
        voice_code : 'fr-CA',
        voice_public_made : true,
        default : false,
        image : 'French'
    },
    {
        language_code : 'fr',
        voice_name : 'fr-CA-Wavenet-B',
        voice_code : 'fr-CA',
        voice_public_made : true,
        default : false,
        image : 'French'
    },
    {
        language_code : 'fr',
        voice_name : 'fr-CA-Wavenet-C',
        voice_code : 'fr-CA',
        voice_public_made : true,
        default : false,
        image : 'French'
    },
    {
        language_code : 'fr',
        voice_name : 'fr-CA-Wavenet-D',
        voice_code : 'fr-CA',
        voice_public_made : true,
        default : false,
        image : 'French'
    },
    {
        language_code : 'fr',
        voice_name : 'fr-FR-Wavenet-E',
        voice_code : 'fr-FR',
        voice_public_made : true,
        default : false,
        image : 'French'
    },
    {
        language_code : 'fr',
        voice_name : 'fr-FR-Wavenet-A',
        voice_code : 'fr-FR',
        voice_public_made : true,
        default : false,
        image : 'French'
    },
    {
        language_code : 'fr',
        voice_name : 'fr-FR-Wavenet-B',
        voice_code : 'fr-FR',
        voice_public_made : true,
        default : false,
        image : 'French'
    },
    {
        language_code : 'fr',
        voice_name : 'fr-FR-Wavenet-C',
        voice_code : 'fr-FR',
        voice_public_made : true,
        default : false,
        image : 'French'
    },
    {
        language_code : 'fr',
        voice_name : 'fr-FR-Wavenet-D',
        voice_code : 'fr-FR',
        voice_public_made : true,
        default : false,
        image : 'French'
    },  //end of FR
    {
        language_code : 'id',
        voice_name : 'id-ID-Standard-A',
        voice_code : 'id-ID',
        voice_public_made : true,
        default : false,
        image : 'Bahasa'
    },
    {
        language_code : 'id',
        voice_name : 'id-ID-Standard-B',
        voice_code : 'id-ID',
        voice_public_made : true,
        default : false,
        image : 'Bahasa'
    },
    {
        language_code : 'id',
        voice_name : 'id-ID-Standard-C',
        voice_code : 'id-ID',
        voice_public_made : true,
        default : false,
        image : 'Bahasa'
    },
    {
        language_code : 'id',
        voice_name : 'id-ID-Standard-D',
        voice_code : 'id-ID',
        voice_public_made : true,
        default : false,
        image : 'Bahasa'
    },
    {
        language_code : 'id',
        voice_name : 'id-ID-Wavenet-D',
        voice_code : 'id-ID',
        voice_public_made : true,
        default : false,
        image : 'Bahasa'
    },
    {
        language_code : 'id',
        voice_name : 'id-ID-Wavenet-A',
        voice_code : 'id-ID',
        voice_public_made : true,
        default : false,
        image : 'Bahasa'
    },
    {
        language_code : 'id',
        voice_name : 'id-ID-Wavenet-B',
        voice_code : 'id-ID',
        voice_public_made : true,
        default : false,
        image : 'Bahasa'
    },
    {
        language_code : 'id',
        voice_name : 'id-ID-Wavenet-C',
        voice_code : 'id-ID',
        voice_public_made : true,
        default : false,
        image : 'Bahasa'
    },  // End of id
    {
        language_code : 'ca',
        voice_name : 'ca-ES-Standard-A',
        voice_code : 'ca-ES',
        voice_public_made : true,
        default : false,
        image : 'Catalan'
    },  // end of catalan
    {
        language_code : 'cmn',
        voice_name : 'cmn-CN-Standard-C',
        voice_code : 'cmn-CN',
        voice_public_made : true,
        default : false,
        image : 'Chinese'
    },
    {
        language_code : 'cmn',
        voice_name : 'cmn-CN-Standard-A',
        voice_code : 'cmn-CN',
        voice_public_made : true,
        default : false,
        image : 'Chinese'
    },
    {
        language_code : 'cmn',
        voice_name : 'cmn-CN-Standard-B',
        voice_code : 'cmn-CN',
        voice_public_made : true,
        default : false,
        image : 'Chinese'
    },
    {
        language_code : 'cmn',
        voice_name : 'cmn-CN-Standard-D',
        voice_code : 'cmn-CN',
        voice_public_made : true,
        default : false,
        image : 'Chinese'
    },
    {
        language_code : 'cmn',
        voice_name : 'cmn-TW-Standard-A',
        voice_code : 'cmn-TW',
        voice_public_made : true,
        default : false,
        image : 'Chinese'
    },
    {
        language_code : 'cmn',
        voice_name : 'cmn-TW-Standard-B',
        voice_code : 'cmn-TW',
        voice_public_made : true,
        default : false,
        image : 'Chinese'
    },
    {
        language_code : 'cmn',
        voice_name : 'cmn-TW-Standard-C',
        voice_code : 'cmn-TW',
        voice_public_made : true,
        default : false,
        image : 'Chinese'
    },
    {
        language_code : 'cmn',
        voice_name : 'cmn-CN-Wavenet-A',
        voice_code : 'cmn-CN',
        voice_public_made : true,
        default : false,
        image : 'Chinese'
    },
    {
        language_code : 'cmn',
        voice_name : 'cmn-CN-Wavenet-B',
        voice_code : 'cmn-CN',
        voice_public_made : true,
        default : false,
        image : 'Chinese'
    },
    {
        language_code : 'cmn',
        voice_name : 'cmn-CN-Wavenet-C',
        voice_code : 'cmn-CN',
        voice_public_made : true,
        default : false,
        image : 'Chinese'
    },
    {
        language_code : 'cmn',
        voice_name : 'cmn-CN-Wavenet-D',
        voice_code : 'cmn-CN',
        voice_public_made : true,
        default : false,
        image : 'Chinese'
    },
    {
        language_code : 'cmn',
        voice_name : 'cmn-TW-Wavenet-A',
        voice_code : 'cmn-TW',
        voice_public_made : true,
        default : false,
        image : 'Chinese'
    },
    {
        language_code : 'cmn',
        voice_name : 'cmn-TW-Wavenet-B',
        voice_code : 'cmn-TW',
        voice_public_made : true,
        default : false,
        image : 'Chinese'
    },
    {
        language_code : 'cmn',
        voice_name : 'cmn-TW-Wavenet-C',
        voice_code : 'cmn-TW',
        voice_public_made : true,
        default : false,
        image : 'Chinese'
    },  // end of cmn
    {
        language_code : 'es',
        voice_name : 'es-US-Standard-A',
        voice_code : 'es-US',
        voice_public_made : true,
        default : false,
        image : 'Spanish'
    },
    {
        language_code : 'es',
        voice_name : 'es-US-Standard-B',
        voice_code : 'es-US',
        voice_public_made : true,
        default : false,
        image : 'Spanish'
    },
    {
        language_code : 'es',
        voice_name : 'es-US-Standard-C',
        voice_code : 'es-US',
        voice_public_made : true,
        default : false,
        image : 'Spanish'
    },
    {
        language_code : 'es',
        voice_name : 'es-ES-Standard-A',
        voice_code : 'es-ES',
        voice_public_made : true,
        default : false,
        image : 'Spanish'
    },
    {
        language_code : 'es',
        voice_name : 'es-ES-Standard-B',
        voice_code : 'es-ES',
        voice_public_made : true,
        default : false,
        image : 'Spanish'
    },
    {
        language_code : 'es',
        voice_name : 'es-ES-Standard-C',
        voice_code : 'es-ES',
        voice_public_made : true,
        default : false,
        image : 'Spanish'
    },
    {
        language_code : 'es',
        voice_name : 'es-ES-Standard-D',
        voice_code : 'es-ES',
        voice_public_made : true,
        default : false,
        image : 'Spanish'
    },
    {
        language_code : 'es',
        voice_name : 'es-ES-Wavenet-B',
        voice_code : 'es-ES',
        voice_public_made : true,
        default : false,
        image : 'Spanish'
    },
    {
        language_code : 'es',
        voice_name : 'es-ES-Wavenet-C',
        voice_code : 'es-ES',
        voice_public_made : true,
        default : false,
        image : 'Spanish'
    },
    {
        language_code : 'es',
        voice_name : 'es-ES-Wavenet-D',
        voice_code : 'es-ES',
        voice_public_made : true,
        default : false,
        image : 'Spanish'
    },
    {
        language_code : 'es',
        voice_name : 'es-US-Wavenet-A',
        voice_code : 'es-US',
        voice_public_made : true,
        default : false,
        image : 'Spanish'
    },
    {
        language_code : 'es',
        voice_name : 'es-US-Wavenet-B',
        voice_code : 'es-US',
        voice_public_made : true,
        default : false,
        image : 'Spanish'
    },
    {
        language_code : 'es',
        voice_name : 'es-US-Wavenet-C',
        voice_code : 'es-US',
        voice_public_made : true,
        default : false,
        image : 'Spanish'
    }, // end of es
    {
        language_code : 'en',
        voice_name : 'es-AU-Standard-A',
        voice_code : 'en-AU',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-AU-Standard-B',
        voice_code : 'en-AU',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-AU-Standard-C',
        voice_code : 'en-AU',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-AU-Standard-D',
        voice_code : 'en-AU',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-GB-Standard-A',
        voice_code : 'en-GB',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-GB-Standard-B',
        voice_code : 'en-GB',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-GB-Standard-C',
        voice_code : 'en-GB',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-GB-Standard-D',
        voice_code : 'en-GB',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-GB-Standard-F',
        voice_code : 'en-GB',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-IN-Standard-A',
        voice_code : 'en-IN',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-IN-Standard-B',
        voice_code : 'en-IN',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-IN-Standard-C',
        voice_code : 'en-IN',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-IN-Standard-D',
        voice_code : 'en-IN',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-US-Standard-A',
        voice_code : 'en-US',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-US-Standard-B',
        voice_code : 'en-US',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-US-Standard-C',
        voice_code : 'en-US',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-US-Standard-D',
        voice_code : 'en-US',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-US-Standard-E',
        voice_code : 'en-US',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-US-Standard-F',
        voice_code : 'en-US',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-US-Standard-G',
        voice_code : 'en-US',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-US-Standard-H',
        voice_code : 'en-US',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-US-Standard-I',
        voice_code : 'en-US',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
    {
        language_code : 'en',
        voice_name : 'es-US-Standard-J',
        voice_code : 'en-US',
        voice_public_made : true,
        default : false,
        image : 'English'
    },
]

const generateAllVoiceModel = () => {
    voiceModelLanguages.map(async (data) => {
        const createVoice = await prisma.voiceLanguage.create({
            data
        })

        console.log(createVoice)
    })
}

generateAllVoiceModel()

