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
    console.log(reciepts);
    let stocktakings = await Stocktaking.find({
      createdAt: {
        $gte: new Date(moment().startOf('month').toDate()),
        $lte: new Date(moment().endOf('month').toDate())
      }
    });
    console.log(stocktakings.length);
    let entries = await Entry.find({
      createdAt: {
        $gte: new Date(moment().startOf('month').toDate()),
        $lte: new Date(moment().endOf('month').toDate())
      }
    });
    console.log(entries.length);
    let users = await User.find({});
    let loggedUser = await User.findOne({ _id: req.body.userId }).populate("role_id", { name: 1 });;

    if (loggedUser.role_id.name.toLowerCase() == "korisnik") {
      reciepts = reciepts.filter(reciept => reciept.user_id == loggedUser._id)
      stocktakings = stocktakings.filter(stocktaking => stocktaking.user_id == loggedUser._id)
      entries = entries.filter(entry => entry.user_id == loggedUser._id)
    }

    return res.status(200).json({
      data: {
        total_reciepts: reciepts.length,
        total_stocktakings: stocktakings.length,
        total_entries: entries.length,
        total_users: users.length,
      }
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = list;
