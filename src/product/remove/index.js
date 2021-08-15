const Product = require("../schema");
const Entry = require("../../entry/schema");
const Reciept = require("../../reciept/schema");
const Stock = require("../../stock/schema");
const Stocktaking = require("../../stocktaking/schema");

async function remove(req, res) {
  try {
    const savedProduct = await Product.findById(req.params.id);
    if (savedProduct) {

      const entries = await Entry.find({ product_id: req.params.id });
      const reciepts = await Reciept.find({ product_id: req.params.id });
      const stocks = await Stock.find({ product_id: req.params.id });
      const stocktakings = await Stocktaking.find({ product_id: req.params.id });

      if (entries.length > 0) {
        return res.status(400).json({ error: "Postoje proizvodi povezani s ovim proizvodom!" });
      }
      else if (reciepts.length > 0) {
        return res.status(400).json({ error: "Postoje preuzimanja povezana s ovim proizvodom!" });
      }
      else if (stocks.length > 0) {
        return res.status(400).json({ error: "Postoje stanja u skladištu povezana s ovim proizvodom!" });
      }
      else if (stocktakings.length > 0) {
        return res.status(400).json({ error: "Postoje inventure povezane s ovim proizvodom!" });
      }
      else {
        await Product.findByIdAndRemove(req.params.id);
        return res.status(200).json({ status: "Uspješno obrisan proizvod!" });
      }

    }
    else {
      return res.status(404).json({ error: "Proizvod nije pronađen!" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = remove;
