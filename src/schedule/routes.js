const express = require('express');
const router = express.Router();
const authenticateJWT = require('../_helpers/authenticateJWT');
const authenticateAdmin = require('../_helpers/authenticateAdmin');

const refresh = require('./refresh/index')

router.post('/refresh', authenticateJWT, authenticateAdmin, refresh);

module.exports = router;