const express = require('express');
const router = express.Router();
const authenticateJWT = require('../_helpers/authenticateJWT');
const authenticateAdmin = require('../_helpers/authenticateAdmin');

const list = require('./list/index');
const add = require('./add/index');
const remove = require('./remove/index');
const edit = require('./edit/index');

router.post('/', authenticateJWT, list);
router.post('/add', authenticateJWT, authenticateAdmin, add);
router.delete('/remove/:id', authenticateJWT, authenticateAdmin, remove);
router.patch('/:id', authenticateJWT, authenticateAdmin, edit);

module.exports = router;