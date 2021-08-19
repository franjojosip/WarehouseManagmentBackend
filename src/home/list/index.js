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
      total_reciepts = reciepts.filter(reciept => reciept.user_id == loggedUser._id).length;
      total_stocktakings = stocktakings.filter(stocktaking => stocktaking.user_id == loggedUser._id).length;
      total_entries = entries.filter(entry => entry.user_id == loggedUser._id).length;
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
