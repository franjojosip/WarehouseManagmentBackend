const express = require("express");
const router = express.Router();

const authenticateJWT = require("../_helpers/authenticateJWT");
const authenticateAdmin = require("../_helpers/authenticateAdmin");
const checkParamID = require("../_helpers/checkParamID");

const list = require("./list/index");
const add = require("./add/index");
const remove = require("./remove/index");
const edit = require("./edit/index");
const submit = require("./submit/index");
const submitStocktakings = require("./submitstocktakings/index");
const report = require("./report/index");

router.post("/", authenticateJWT, list);
router.post("/report", authenticateJWT, report);
router.post("/add", authenticateJWT, add);
router.delete("/remove/:id", checkParamID, authenticateJWT, remove);
router.patch("/submitall", authenticateJWT, submitStocktakings);
router.patch("/:id", checkParamID, authenticateJWT, edit);
router.patch("/submit/:id", checkParamID, authenticateJWT, submit);

module.exports = router;
