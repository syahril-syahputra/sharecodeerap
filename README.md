
![Logo](https://assets-global.website-files.com/6409a29e13689e2a58d37a27/647ea1d0c5092e1c43f71a61_logo.png)


# Hi Eureka REST API

Build on Node, Prisma ORM as main database layer Firebase for analytic and push notification

## Documentation

* [API Documentation](https://eurekaapi.docs.apiary.io/#)
* [DB Schema](https://lucid.app/lucidchart/invitations/accept/inv_270e02f5-64d6-46cb-9f6e-3671d5f4e90f?viewport_loc=-331%2C66%2C2872%2C1368%2C0_0)

## Requirements

* NodeJS version 12 or higher
* Redis version 6 or higher
* MySQL 8
* PM2 with ecosystem.config.js 
  * (PM2 ecosystem.config.js start/stop/restart to start etc)
  * (PM2 list - to see the running processes)

 ## Installation

* `npm install`
* `cp .env.example .env` 
* Change `.env` value accordingly
* run `npx prisma migrate dev`
* install prisma client `npm install @prisma/client`

## Running

* Main App `nodemon app.js` or `pm2 start app.js`
## Test

Use jest and supertest inside `./tests` folder and run `npm test`

## Code

The code is split into 2 different entities Admin & User
Public routes are those such as login, register, forgot password, etc.


## Tech Stack

**Server:** Node, Express, PM2, Prisma ORM, Docker, Redis, Stripe, Firebase, GPT

| API | Link     |
| :-------- | :------- |
| `Auth` | [view](#auth) |
| `GPT` | [view](#gpt) |
| `Account` | [view](#account) |
| `User` | [view](#user) |
| `Topic` | [view](#topic) |
| `Quiz` | [view](#quiz) |
| `Activity` | [view](#activity) |

## API Reference
### Auth
#### Request Login

```http
  POST /request-login
```

| Body | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `email` | `string` | **Required**. |

  - Response :

```json
      {"data":{},"statusCode":{"code":1,"msg":"Ok","debug":"OK"}}
```

#### Login Pin

```http
  POST /login-pin
```

| Body | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `email`      | `string` | **Required**. Email for use to get user identity |
| `pin`      | `int` | **Required**. Pin to match with the user data |

  - Response :
  ```json
{
    "data": {
        "id": Int,
        "email": String,
        "firstname": String,
        "lastname": String, //! Not been used since app just using Firstname
        "verified": Boolean,
        "isAdmin": Boolean,
        "talkMethod": "Hold" || "Tap",
        "userLevelId": Int,
        "points": Int,
        "birthday": DateFormat,
        "languageId": Int,
        "UserLevel": {
            "id": Int,
            "tier": Int,
            "name": String,
            "name_fr": String,
            "name_ct": String,
            "name_es": String,
            "name_id": String,
            "name_cn": String,
            "points": Int
        },
        "questionAsked": Int,
        "dailyRecap": Boolean,
        "weeklyRecap": Boolean,
        "account": {
            "id": Int,
            "createdAt": DateFormat,
            "updatedAt": DateFormat,
            "status": Boolean || tinyInt,
            "customerId": String,
            "email": String,
            "canonicalEmail": String,
            "name": String,
            "currency": String,
            "isDev": Boolean, //! Used to indicate if the user is a Development User
            "paymentSource": Enum,
            "planId": Int,
            "subscriptionDefaultPaymentMethod": Enum,
            "subscriptionCreatedAt": DateFormat,
            "subscriptionId": String,
            "subscriptionStatus": String,
            "subscriptionCurrentPeriodStart": DateFormat,
            "subscriptionCurrentPeriodEnd": DateFormat,
            "transactionId": String,
            "cancel_at": DateFormat,
            "cancel_at_period_end": Boolean,
            "canceled_at": DateFormat,
            "appleReceipt": String,
            "lastActivity": DateFormat,
            "productId": int,
            "Product": Product,
            "Plan": Plan
        },
        "fcmToken": String || Null,
        "UserNotificationTopic": [
            {
                "id": Int,
                "createdAt": DateFormat,
                "userId": Int,
                "notificationTopicId": Int,
                "active": Boolean,
                "NotificationTopic": {
                    "id": Int,
                    "createdAt": DateFormat,
                    "name": String,
                    "tagName": String
                }
            }
            ],
        "token": String
    },
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
  ```


  
---
---
---
---
---
### GPT

#### Process GPT

```http
  POST /gpt/stt-process
```

| Body | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `audio_file`      | `Binary` | **Required**. Supported for mp3, mp4, mpeg, mpga, m4a, wav, and webm. 
|  |  |At least need audio length more than 1 sec to make it works |

| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

 - Response :
 ```json
{
    "data": {
        "message": "Will return converted transcription from audio file into Text",
        "references": "830a8b0438df94e11c5b5ef72f52c63e" //! This used to be called in next process, References Process
    },
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
 ```

#### References Process

```http
  POST /gpt/references-process
```

| Body | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `reference`      | `string` | **Required**. reference used to get prompt by the metadata_token |

| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

  - Response :
```json
{
    "data": {
        "id": Int,
        "createdAt": DateFormat,
        "sessionId": Id,
        "request": String,
        "response": String,
        "responseTime": Int,
        "promptToken": Int,
        "completionToken": Int,
        "totalTokens": Int,
        "type": "DEFAULT",
        "promptParentId": Int,
        "userId": Int,
        "metadataToken": "830a8b0438df94e11c5b5ef72f52c63e",
        "defaultPromptId": Int,
        "deletedAt": DateFormat,
        "deleted": Boolean,
        "reported": Boolean,
        "reportedAt": DateFormat,
        "isCorrect": Boolean,
        "funFactsScore": Int,
        "learnMoreScore": Int,
        "topicId": Int,
        "quizEntryId": Int,
        "fullRequest": String,
        "max_tokens": Int
    },
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```

#### Quiz

```http
  POST /gpt/quiz/:topicId

```
  | Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |
 
  - Response : 
  ```json
  {
    "data": {
        "id": Int,
        "createdAt": DateFormat,
        "sessionId": Int,
        "request": "Quiz",
        "responseTime": Int,
        "promptToken": Int,
        "completionToken": Int,
        "totalTokens": Int,
        "type": "QUIZ",
        "promptParentId": Int,
        "userId": Int,
        "metadataToken": String,
        "defaultPromptId": Int,
        "deletedAt": DateFormat,
        "deleted": Boolean,
        "reported": Boolean,
        "reportedAt": DateFormat,
        "isCorrect": Boolean,
        "funFactsScore": Int,
        "learnMoreScore": Int,
        "topicId": Int,
        "quizEntryId": Int,
        "Topic": Topic,
        "Quiz": [
            {
                "id": 1,
                "createdAt": DateFormat,
                "topicId": Int,
                "promptId": Int,
                "userId": Int,
                "finished": Int,
                "QuizEntry": [
                    {
                        "id": Int,
                        "createdAt": DateFormat,
                        "repliedAt": DateFormat,
                        "isCorrect": Boolean,
                        "quizId": 1,
                        "question": "Apakah singa adalah hewan yang hidup di hutan?",
                        "correctAnswer": Boolean
                    },
                ]
            }
        ]
    },
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```

#### Story

```http
  POST /gpt/story
```

| Body | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `topics`      | `array` | **Required**. Array of topics Id |

| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

 - Response :
 ```json
{
    "data": {
        "id": Int,
        "createdAt": DateFormat,
        "sessionId": Int,
        "request": "Story",
        "response": "Pada suatu hari di hutan Afrika, ada seekor singa yang sangat kuat dan gagah. Nama singa itu adalah Leo. Dia adalah raja dari seluruh hutan dan semua binatang di sana menghormatinya.\n\nLeo adalah singa yang sangat baik hati dan adil. Dia selalu melindungi binatang-binatang yang lemah dari serangan hewan buas lainnya. Dia juga selalu siap membantu teman-temannya jika mereka membutuhkan bantuan.\n\nSelain menjadi raja, Leo juga sangat pandai berburu. Setiap pagi, dia pergi mencari makanan untuk dirinya sendiri",
        "responseTime": Int,
        "promptToken": Int,
        "completionToken": Int,
        "totalTokens": Int,
        "type": "STORY",
        "promptParentId": null,
        "userId": Int,
        "metadataToken": String,
        "defaultPromptId": Int,
        "deletedAt": DateFormat,
        "deleted": Boolean,
        "reported": Boolean,
        "reportedAt": DateFormat,
        "isCorrect": Boolean,
        "funFactsScore": Int,
        "learnMoreScore": Int,
        "topicId": Int,
        "quizEntryId": Int,
        "fullRequest": String,
        "Topic": Topic,
    },
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
 ```

#### Fact

```http
  POST /gpt/fact/:topicId
```
| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

  - Response :
  ```json
  {
    "data": {
        "result": [
            "Singa adalah hewan karnivora yang merupakan bagian dari keluarga Felidae.",
            "Singa jantan memiliki bulu berwarna cokelat keemasan, sementara singa betina memiliki bulu berwarna lebih pucat.",
            "Singa adalah hewan sosial dan biasanya hidup dalam kelompok yang disebut dengan pride.",
            "Singa memiliki suara yang kuat dan dapat terdengar hingga 8 kilometer jauhnya."
        ],
        "id": Int,
        "createdAt": DateFormat,
        "sessionId": Int,
        "request": "Facts about Lion",
        "response": String",
        "responseTime": Int,
        "promptToken": Int,
        "completionToken": Int,
        "totalTokens": Int,
        "type": "FACT",
        "promptParentId": Int,
        "userId": Int,
        "metadataToken": String,
        "defaultPromptId": Int,
        "deletedAt": DateFormat,
        "deleted": Boolean,
        "reported": Boolean,
        "reportedAt": DateFormat,
        "isCorrect": true,
        "funFactsScore": Int,
        "learnMoreScore": Int,
        "topicId": 13,
        "quizEntryId": Int,
        "fullRequest": String,
        "Topic": {
            "id": Int,
            "name": String,
            "name_fr": String,
            "name_ct": String,
            "name_es": String,
            "name_id": String,
            "name_cn": String,
            "imageId": String,
            "imageUrl": String,
            "activityId": Int,
            "userLevelId": Int
        },
    },
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
  ```

  #### Fun Fact

```http
  POST /gpt/fun-fact/:promptId
```
| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

  - Response :
  ```json
  {
    "data": {
        "funFacts": [
            "Fakta menyenangkan 1: Transkripsi dalam bahasa Indonesia menggunakan sistem ejaan yang berbeda dengan bahasa Inggris.",
            "Fakta menyenangkan 2: Transkripsi digunakan dalam berbagai bidang seperti musik, bahasa, dan ilmu pengetahuan.",
            "Fakta menyenangkan 3: Transkripsi bahasa Indonesia dilakukan dengan mengikuti aturan ejaan yang telah ditetapkan."
        ],
        "id": Int,
        "createdAt": DateFormat,
        "sessionId": Int,
        "request": String,
        "response": String,
        "responseTime": Int,
        "promptToken": Int,
        "completionToken": Int,
        "totalTokens": Int,
        "type": "FUN_FACTS",
        "promptParentId": Int,
        "userId": Int,
        "metadataToken": String,
        "defaultPromptId": Int,
        "deletedAt": DateFormat,
        "deleted": Boolean,
        "reported": Boolean,
        "reportedAt": DateFormat,
        "isCorrect": Boolean,
        "funFactsScore": Int,
        "learnMoreScore": Int,
        "topicId": Int,
        "quizEntryId": Int,
        "fullRequest": String,
        "Topic": Topic,
    },
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
  ```

  #### Explain More

```http
  POST /gpt/explain-more/:promptId
```
| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

- Response : 
```json
{
    "data": {
        "id": Int,
        "createdAt": DateFormat,
        "sessionId": Int,
        "request": "Hai Bagus! Tentu, saya bisa menunjukkan bagaimana transkripsi yang digunakan. Jadi, transkripsi adalah cara untuk menulis suara dalam bentuk huruf-huruf. Misalnya, kata",
        "response": "Hai! Tentu, aku bisa menjelaskan lebih lanjut tentang transkripsi dengan cara yang lebih mudah dipahami oleh anak berusia 9 tahun. Jadi, transkripsi adalah cara untuk menulis suara-suara yang kita dengar menggunakan huruf-huruf. Misalnya, kata \"anjing\". Untuk menuliskannya dalam bentuk transkripsi, kita akan menggunakan huruf-huruf seperti ini: \"a-n-j-i-ng\". Jadi, dengan transkripsi, kita bisa menulis suara-suara yang kita dengar dalam bentuk huruf-huruf yang bisa kita baca. Apakah itu membuatmu mengerti?",
        "responseTime": Int,
        "promptToken": Int,
        "completionToken": Int,
        "totalTokens": Int,
        "type": "EXPLAIN_MORE",
        "promptParentId": Int,
        "userId": Int,
        "metadataToken": String,
        "defaultPromptId": Int,
        "deletedAt": DateFormat,
        "deleted": Boolean,
        "reported": Boolean,
        "reportedAt": DateFormat,
        "isCorrect": Boolean,
        "funFactsScore": Int,
        "learnMoreScore": Int,
        "topicId": Int,
        "quizEntryId": Int,
        "fullRequest": String,
    },
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```

 #### Idle

  this API is still on Hold caused too many request app did for this API, it makes user feel uncomfortable.

```http
  POST /gpt/idle
```
| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

- Response :
```json
{
    "data": {
        "id": Int,
        "createdAt": DateFormat,
        "sessionId": Int,
        "request": "Idle",
        "response": "Apa topik terbaru yang dibahas dalam percakapan ini?",
        "responseTime": Int,
        "promptToken": Int,
        "completionToken": Int,
        "totalTokens": Int,
        "type": "IDLE",
        "promptParentId": Int,
        "userId": Int,
        "metadataToken": String,
        "defaultPromptId": Int,
        "deletedAt": DateFormat,
        "deleted": Boolean,
        "reported": Boolean,
        "reportedAt": DateFormat,
        "isCorrect": Boolean,
        "funFactsScore": Int,
        "learnMoreScore": Int,
        "topicId": Int,
        "quizEntryId": Int,
        "fullRequest": String,
    },
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```

 #### Continue Prompt

    This API used to cover up the interupted Prompt/Response from the GPT Process

```http
  POST /gpt/continue/:promptId
```
| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

- Response :
```json
{
    "data": {
        "id": Int,
        "createdAt": DateFormat,
        "sessionId": Int,
        "response": String, //The response wiil continue only the interupted prompt
        "responseTime": Int,
        "promptToken": Int,
        "completionToken": Int,
        "totalTokens": Int,
        "type": "DEFAULT",
        "promptParentId": Int,
        "userId": Int,
        "metadataToken": String,
        "defaultPromptId": Int,
        "deletedAt": DateFormat,
        "deleted": Boolean,
        "reported": Boolean,
        "reportedAt": DateFormat,
        "isCorrect": Boolean,
        "funFactsScore": Int,
        "learnMoreScore": Int,
        "topicId": Int,
        "quizEntryId": Int,
    },
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```
---
---
---
---
---
### Account

#### Get Account

```http
  GET /account
```
| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

- Response :
```json
{
    "data": {
        "id": Int,
        "createdAt": DateFormat,
        "updatedAt": DateFormat,
        "status": Int,
        "customerId": Int,
        "email": String,
        "canonicalEmail": String,
        "name": String,
        "currency": null,
        "isDev": null,
        "paymentSource": "APPLE",
        "planId": Int,
        "subscriptionDefaultPaymentMethod": null,
        "subscriptionCreatedAt": "2024-01-02T05:57:36.559Z",
        "subscriptionId": Int,
        "subscriptionStatus": "active",
        "subscriptionCurrentPeriodStart": "2024-01-02T05:57:36.559Z",
        "subscriptionCurrentPeriodEnd": "2025-01-02T05:57:36.559Z",
        "transactionId": null,
        "cancel_at": null,
        "cancel_at_period_end": null,
        "canceled_at": null,
        "appleReceipt": String,
        "lastActivity": "2024-01-26T05:08:18.385Z",
        "productId": Int,
        "Product": Product,
        "Plan": Plan,
        "tokensUsed": Int
    },
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```



- Response :
```json
{
    "data": {
        "users": [
            {
                "id": Int,
                "email": String,
                "firstname": String,
                "lastname": String,
                "verified": Boolean,
                "isAdmin": Boolean,
                "talkMethod": "Tap" || "Hold",
                "userLevelId": Int,
                "points": Int,
                "birthday": DateFormat,
                "languageId": Int,
                "UserLevel": UserLevel,
                "questionAsked": Int,
                "dailyRecap": Boolean,
                "weeklyRecap": Boolean,
                "account": Account
            }
        ],
        "pagination": {
            "skip": 0,
            "take": 10, //! query.perPage
            "total": 1 //! query.page
        }
    },
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```

#### Get Account Usage

```http
  POST /account/usage
```
| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

| Body | Description                       |
| :-------- | :-------------------------------- |
| `startDate`      | **Required**. exp. '2024-01-12' |
| `endDate`      | **Required**. exp. '2024-01-12' |

- Response :
```json
{
    "data": {
        "tokensUsed": Int
    },
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```
---
---
---
---
---
### User

#### Create User

```http
  POST /user/create
```
| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

| Body | Type                       | Description |
| :-------- | :------------- |:----------------------- |
| `firstname`      | String |**Required** |
| `lastname`      | String |**Required** |
| `pin`      | String |**Required** |

- Response :
```json
{
    "data": {
        "id": Int,
        "firstname": "Francisca",
        "lastname": "Konopelski"
    },
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```

#### Get user Profile

```http
  GET /user/profile
```
| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

- Response :
```json
{
    "data": {
        "id": Int,
        "email": String,
        "firstname": String,
        "lastname":String,
        "verified": Boolean,
        "isAdmin": Boolean,
        "talkMethod": "Tap",
        "userLevelId": Int,
        "points": Int,
        "birthday": DateFormat,
        "languageId": Int,
        "UserLevel": {
            "id": Int,
            "tier": Int,
            "name": String,
            "name_fr": String,
            "name_ct": String,
            "name_es": String,
            "name_id": String,
            "name_cn": String,
            "points": Int
        },
        "questionAsked": Int,
        "dailyRecap": Boolean,
        "weeklyRecap": Boolean,
        "account": Account,
        "fcmToken": String,
        "UserNotificationTopic": [
            {
                "id": Int,
                "createdAt": DateFormat,
                "userId": Int,
                "notificationTopicId": Int,
                "active": Boolean,
                "NotificationTopic": {
                    "id": Int,
                    "createdAt":DateFormat,
                    "name": String,
                    "tagName": String
                }
            }
        ]
    },
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```

#### Delete User Profile

```http
  DELETE /user/:userId
```
| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

- Response : 
```json
{
    "data": {},
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```

#### Update User Profile

```http
  PUT /user/:userId
```
| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

| Body | Type                       |
| :-------- | :-------------------------------- |
| `firstname`      | String |
| `lastname`      | String |
| `pin`      | Int |
| `birthday`      | DateFormat exp. "2024-01-25"|
| `languageId`      | Int |
| `talkMethod`      | "Hold" / "Tap" |
| `dailyRecap`      | Boolean |
| `social`      | Array of socialId |


- Response : 
```json
{
    "data": {},
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```



| Body | Type                       |
| :-------- | :-------------------------------- |
| `languageId`      | Int |

- Response :
```json
{
    "data": {},
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```

#### Update User Admin

```http
  PUT /user/admin/:userId
```
| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

| Body | Description                       |
| :-------- | :-------------------------------- |
| `isAdmin`      | **Required**. Boolean |

- Response : 
```json
{
    "data": {},
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```
---
---
---
---
---
---
### Quizzes

#### Get Quizzes

```http
  GET /quiz/
```
| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

- Response : 
```json
{
    "data": {
        "quizzes": [
            {
                "id": 675,
                "createdAt": DateFormat,
                "topicId": Int,
                "promptId": Int,
                "userId": Int,
                "finished": Boolean
            }
        ],
        "pagination": {
            "skip": 0,
            "take": 10,
            "total": 9
        }
    },
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```

#### Get Quiz Detail

```http
  GET /quiz/:quizId(675)
```
| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

- Response :
```json
{
    "data": {
        "id": 675,
        "createdAt": DateFormat,
        "topicId": Int,
        "promptId": Int,
        "userId": Int,
        "finished": Boolean,
        "QuizEntry": [
            {
                "id": 3371,
                "createdAt": DateFormat,
                "repliedAt": DateFormat,
                "isCorrect": Boolean,
                "quizId": 675,
                "question": "Apakah singa adalah hewan yang hidup di hutan?",
                "correctAnswer": Boolean
            }
        ]
    },
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```

#### Answer Quiz Entry

```http
  POST /quiz/:quizEntryId(3371)
```
| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

| Body | Description                       |
| :-------- | :-------------------------------- |
| `value`      | **Required**.  Boolean|

- Response :
```json
{
    "data": {
        "id": 3371,
        "createdAt": DateFormat,
        "repliedAt": DateFormat,
        "isCorrect": Boolean,
        "quizId": 675,
        "question": "Apakah singa adalah hewan yang hidup di hutan?",
        "correctAnswer": Boolean
    },
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```
---
---
---
---
---
### Topic

#### Get all topics paginated

```http
  GET /topics/all
```
| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

| Params | Description                       |
| :-------- | :-------------------------------- |
| `page`      | **Optional**.|
| `perPage`      | **Optional**.|

- Response :
```json
{
    "data": {
        "topics": [
            {
                "id": Int,
                "name": String,
                "name_fr": String,
                "name_ct": String,
                "name_es": String,
                "name_id": String,
                "name_cn": String,
                "imageId": String,
                "imageUrl": String,
                "activityId": Int,
                "userLevelId": Int
            },
        ],
        "pagination": {
            "skip": 0,
            "take": 10,
            "total": 53
        }
    },
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```

#### Get topics by activityId

```http
  GET /topics/:activityId
```
| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

- Response :
```json
{
    "data": [
        {
            "id": Int,
            "name": String,
            "name_fr": String,
            "name_ct": String,
            "name_es": String,
            "name_id": String,
            "name_cn": String,
            "imageId": String,
            "imageUrl": String,
            "activityId": 2,
            "userLevelId": Int,
            "finishedQuiz": Boolean,
            "finishedFact": Boolean
        },
    ],
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```
---
---
---
---
### Activity

#### Get Activities

```http
  GET /Activities
```
| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

- Response :
```json
{
    "data": {
        "activities": [
            {
                "id": Int,
                "name": String,
                "name_fr": String,
                "name_ct": String,
                "name_es": String,
                "name_id": String,
                "name_cn": String,
                "imageId": String,
                "imageUrl": String,
                "userLevelId": Int,
                "totalFactsCompleted": Int,
                "totalQuizCompleted": Int,
                "totalTopics": Int
            }
        ],
        "pagination": {
            "skip": 0,
            "take": 10,
            "total": 6
        }
    },
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```
---
---
---
---
---
### Point Of Interest

#### Get all Point Of Interest

```http
  GET /pois
```
| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

- Response :
```json
{
    "data": [
        {
            "id": Int,
            "createdAt": DateFormat,
            "updatedAt": DateFormat,
            "name": "Sangiran Early Man Site",
            "latitude": FLOAT,
            "longitude": FLOAT,
            "description": "An archaeological site where fossils of early human ancestors were discovered.",
            "image": String,
            "unsplashId": String,
            "generatedAt": DateFormat,
            "poiLocationId": Int,
            "validatedAt": DateFormat,
            "validatedById": Int,
            "distance": FLOAT,
            "Category": {
                "id": Int,
                "name": "Historical Sites educative for kids",
                "imageUrl": String
            },
            "Country": {
                "id": Int,
                "name": "Indonesia",
                "imageUrl": String
            }
        }
    ]
    ,
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```

#### Get Point Of Interest By Coordinate

```http
  POST /pois
```
| Header | Description                       |
| :-------- | :-------------------------------- |
| `token`      | **Required**. |

| Body | Type                       | Description |
| :-------- | :------------- |:----------------------- |
| `latitude`      | FLOAT |**Required** |
| `longitude`      | FLOAT |**Required** |
| `limit`      | Int |**Required** |
| `distance`      | Int |**Required** |

- Response :
```json
{
    "data": [
        {
            "id": Int,
            "createdAt": DateFormat,
            "updatedAt": DateFormat,
            "name": String,
            "latitude": FLOAT,
            "longitude": FLOAT,
            "description": String,
            "image": String,
            "unsplashId": String,
            "generatedAt": DateFormat,
            "poiLocationId": Int,
            "validatedAt": DateFormat,
            "validatedById": Int,
            "distance": FLOAT,
            "Category": {
                "id": Int,
                "name":String,
                "imageUrl": String
            },
            "Country": {
                "id": Int,
                "name": String,
                "imageUrl": String
            }
        }
    ]
    ,
    "statusCode": {
        "code": 1,
        "msg": "Ok",
        "debug": "OK"
    }
}
```