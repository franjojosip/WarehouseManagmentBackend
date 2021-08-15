const express = require('express');
const router = express.Router();

const authenticateJWT = require('../_helpers/authenticateJWT');

const list = require('./list/index');

router.post('/', authenticateJWT, list);

module.exports = router;