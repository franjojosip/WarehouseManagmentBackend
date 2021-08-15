const Location = require("../schema");
const Entry = require("../../entry/schema");
const Warehouse = require("../../warehouse/schema");
const Stock = require("../../stock/schema");
const Stocktaking = require("../../stocktaking/schema");

async function remove(req, res) {
  try {
    const savedLocation = await Location.findById(req.params.id);
    if (savedLocation) {
      const entries = await Entry.find({ location_id: req.params.id });
      const warehouses = await Warehouse.find({ location_id: req.params.id });
      const stocks = await Stock.find({ location_id: req.params.id });
      const stocktakings = await Stocktaking.find({ location_id: req.params.id });

      if (entries.length > 0) {
        return res.status(400).json({ error: "Postoje unosi povezani s ovom lokacijom!" });
      }
      else if (warehouses.length > 0) {
        return res.status(400).json({ error: "Postoje skladišta povezana s ovom lokacijom!" });
      }
      else if (stocks.length > 0) {
        return res.status(400).json({ error: "Postoje stanja skladišta povezana s ovom lokacijom!" });
      }
      else if (stocktakings.length > 0) {
        return res.status(400).json({ error: "Postoje inventure povezane s ovom lokacijom!" });
      }
      else {
        await Location.findByIdAndRemove(req.params.id);
        return res.status(200).json({ status: "Uspješno obrisana lokacija!" });
      }
    }
    else {
      return res.status(404).json({ error: "Lokacija nije pronađena!" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = remove;
