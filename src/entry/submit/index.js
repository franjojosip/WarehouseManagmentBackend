const Entry = require("../schema");
const Stock = require("../../stock/schema");

async function submit(req, res) {
  try {
    const submittedEntry = await Entry.findById(req.params.id);
    const currentStock = await Stock.findOne({ warehouse_id: submittedEntry.warehouse_id, product_id: submittedEntry.product_id });

    if (submittedEntry && currentStock) {
      let oldQuantity = currentStock.quantity;
      
      submittedEntry.isSubmitted = true;
      currentStock.quantity = oldQuantity + submittedEntry.quantity;

      await submittedEntry.save();
      await currentStock.save();

      return res.status(200).json({ status: "Uspješno potvrđen unos!" });
    } else {
      return res.status(404).json({ error: "Unos neispravan provjerite stanje!" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = submit;
