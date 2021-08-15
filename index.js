const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require('mongoose');
const logger = require("morgan");
const { loadModules, loadRoutes } = require('./src/utils/index');

app.use(logger("dev"));
app.use(cors());
app.use(express.json());

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

const port = process.env.PORT;
app.listen(port);

module.exports = app;