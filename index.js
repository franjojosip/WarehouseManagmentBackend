const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require('mongoose');
const { loadModules, loadRoutes } = require('./src/utils/index');
const { AwakeHeroku } = require("awake-heroku");

app.use(cors());

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const mongoDBurl = process.env.MONGO_DB_URL;
mongoose.connect(mongoDBurl, { useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true }).then(() => {
  //Express Modules
  loadModules();
  // Express Routes
  loadRoutes(app);

  app.get('/', (req, res) => {
    res.send('Warehouse Managament API..');
  });
});
app.use(express.json());

const port = process.env.PORT || 8000;
app.listen(port);

AwakeHeroku.add("https://upravljanjeskladistimaserver.herokuapp.com");
AwakeHeroku.start();

module.exports = app;