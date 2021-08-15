const Stock = require("../schema");

async function remove(req, res) {
  try {
    const savedStock = await Stock.findById(req.params.id);
    if (savedStock) {
      await Stock.findByIdAndRemove(req.params.id);
      return res.status(200).json({ status: "Uspješno obrisan unos na stanje!" });
    } else {
      return res.status(404).json({ error: "Unos na stanje nije pronađeno!" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = remove;
