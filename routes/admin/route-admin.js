const express = require('express');

const accounts = require('./accounts');
const dashboard = require('./dashboard');
const users = require('./users');
const adminUsers = require('./admin-users');
const languages = require('./languages');
const playground = require('./playground');
const socials = require('./socials');
const systemPrompt = require('./system-prompt');
const userLevels = require('./userlevels');
const countries = require('./countries');
const prompts = require('./prompts');
const sessions = require('./sessions');
const engines = require('./engines');
const faqs = require('./faqs');
const pois = require('./pois');
const unsplash = require('./unsplash');
const shutterstock = require('./shutterstock');
const poiCategories = require('./pois-category');
const poiImages = require('./pois-images');
const poiLocations = require('./pois-locations');
const waitlist = require('./waitlists');
const products = require('./product');
const inviteLink = require('./invite-link');
const activities = require('./activities');
const quiz = require('./quizzes');
const topics = require('./topics');
const defaultPrompts = require('./default-prompts');
const openAIParams = require('./openai-params')
const logs = require("./logs");
const voices = require("./voiceLanguage");
const mail = require('./mail-log')
const storyParams = require('./storyParams')
const funfact = require("./fun-facts")
const ageRange = require("./ageRange")
const predefinedQuestion = require("./predefinedQuestions")
const typeOfStory = require('./typeOfStory')
const auth = require('./auth');
const settings = require('./settings');
const notifications = require('./notifications');
const query = require('./query');
const plan = require('./plan');
const routeSystemPrompt = require("./system-prompt");

module.exports = express.Router()
	.use('/accounts', accounts)
	.use('/dashboard', dashboard)
	.use('/users', users)
	.use('/admin-users', adminUsers)
	.use('/languages', languages)
	.use('/playground', playground)
	.use('/socials', socials)
	.use('/activities', activities)
	.use('/topics', topics)
	.use('/userlevels', userLevels)
	.use('/countries', countries)
	.use('/prompts', prompts)
	.use('/quiz', quiz)
	.use('/engines', engines)
	.use('/faqs', faqs)
	.use('/unsplash', unsplash)
	.use('/shutterstock', shutterstock)
	.use('/pois', pois)
	.use('/poi-categories', poiCategories)
	.use('/poi-images', poiImages)
	.use('/poi-locations', poiLocations)
	.use('/voices', voices)
	.use('/waitlist', waitlist)
	.use('/products', products)
	.use('/invite-link', inviteLink)
	.use('/questions', predefinedQuestion )
	.use('/age-range', ageRange)
	.use('/sessions', sessions)
	.use('/default-prompts', defaultPrompts)
	.use('/openai-params', openAIParams)
	.use("/logs", logs)
	.use('/settings', settings)
	.use("/fun-facts", funfact)
	.use("/mail", mail)
	.use("/story-params", storyParams)
	.use('/type-of-story', typeOfStory)
	.use('/notifications', notifications)
	.use('/query', query)
	.use('/plan', plan)
	.use("/system-prompt", systemPrompt)
	.use('/', auth)
 ;