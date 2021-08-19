const Reciept = require("../../reciept/schema");
const Stocktaking = require("../../stocktaking/schema");
const Entry = require("../../entry/schema");
const User = require("../../users/schema");
const moment = require("../../../node_modules/moment");

async function list(req, res) {
  try {
    let reciepts = await Reciept.find({
      createdAt: {
        $gte: new Date(moment().startOf('month').toDate()),
        $lte: new Date(moment().endOf('month').toDate())
      }
    });
    let stocktakings = await Stocktaking.find({
      createdAt: {
        $gte: new Date(moment().startOf('month').toDate()),
        $lte: new Date(moment().endOf('month').toDate())
      }
    });
    let entries = await Entry.find({
      createdAt: {
        $gte: new Date(moment().startOf('month').toDate()),
        $lte: new Date(moment().endOf('month').toDate())
      }
    });
    let users = await User.find({});

    let loggedUser = await User.findOne({ _id: req.body.userId }).populate("role_id", { name: 1 });

    let total_reciepts = reciepts.length;
    let total_stocktakings = stocktakings.length;
    let total_entries = entries.length;
    let total_users = users.length;


    if (loggedUser.role_id.name.toLowerCase() == "korisnik") {
      total_reciepts = 0;
      total_stocktakings = 0;
      total_entries = 0;

      reciepts.forEach(reciept => { if (reciept.user_id == loggedUser.id) total_reciepts++; });
      stocktakings.forEach(stocktaking => { if (stocktaking.user_id == loggedUser.id) total_stocktakings++; });
      entries.forEach(entry => { if (entry.user_id == loggedUser.id) total_entries++; });
    }

    return res.status(200).json({
      data: {
        total_reciepts,
        total_stocktakings,
        total_entries,
        total_users,
      }
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = list;
