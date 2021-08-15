const Warehouse = require("../schema");
const Entry = require("../../entry/schema");
const Stock = require("../../stock/schema");
const Stocktaking = require("../../stocktaking/schema");
const Reciept = require("../../reciept/schema");

async function remove(req, res) {
  try {
    const savedWarehouse = await Warehouse.findById(req.params.id);
    if (savedWarehouse) {

      const entries = await Entry.find({ user_id: req.params.id });
      const stocks = await Stock.find({ user_id: req.params.id });
      const stocktakings = await Stocktaking.find({ user_id: req.params.id });
      const reciepts = await Reciept.find({ user_id: req.params.id });

      if (entries.length > 0) {
        return res.status(400).json({ error: "Postoje unosi u skladište povezani s ovim skladištem!" });
      }
      else if (stocks.length > 0) {
        return res.status(400).json({ error: "Postoje stanja u skladištu povezana s ovim skladištem!" });
      }
      else if (stocktakings.length > 0) {
        return res.status(400).json({ error: "Postoje inventure povezane s ovim skladištem!" });
      }
      else if (reciepts.length > 0) {
        return res.status(400).json({ error: "Postoje preuzimanja povezana s ovim skladištem!" });
      }
      else {
        await Warehouse.findByIdAndRemove(req.params.id);
        return res.status(200).json({ status: "Uspješno obrisano skladište!" });
      }
    } else {
      return res.status(404).json({ error: "Skladište nije pronađeno!" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = remove;
