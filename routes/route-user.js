const express = require('express');
const userController = require("../libs/controllers/user");
const { auth } = require('../libs/middleware/lib-auth');
const { loginPin, switchUser } = require('../libs/controllers/auth');
module.exports = express.Router()

    .use(auth)
    .get('/', async (req, res ) => {
        await userController.getAllUser(req, res)
    })
    .post('/create', async (req, res) => {
        await userController.create(req, res);
    })
    .post('/language', async (req, res) => {
        await userController.changeUserLanguage(req, res);
    })
    .post('/invite', async (req, res) => {
        await userController.invite(req, res);
    })
    .post('/invite/confirm', async (req, res) => {
        await userController.inviteConfirm(req, res);
    })
    .put('/:id', async (req, res) => {
        await userController.editUser(req, res);
    })
    .post('/token', async (req, res) => {
        await userController.getTokenForUser(req, res);
    })
    .get('/profile', async (req, res) => {
        await userController.getProfile(req, res);
    })
    .delete('/:id', async (req, res) => {
        await userController.deleteUser(req, res);
    })
    .put('/admin/:id', async (req, res) => {
        await userController.setUserAdmin(req, res);
    })
    .post('/switch/:id', async ( req, res ) => {
        await switchUser(req, res);
    })
    .post('/opened-app', async ( req, res ) => {
        await userController.userOpenedApp(req, res);
    })
    .put('/recap/:id', async (req, res) => {
        await userController.recapUserUpdate(req, res)
    })

;