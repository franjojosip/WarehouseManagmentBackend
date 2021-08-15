const Reciept = require("../schema");

async function remove(req, res) {
  try {
    const savedReciept = await Reciept.findById(req.params.id);
    if (savedReciept) {
      await Reciept.findByIdAndRemove(req.params.id);
      return res.status(200).json({ status: "Uspješno obrisano preuzimanje!" });
    } else {
      return res.status(404).json({ error: "Preuzimanje nije pronađeno!" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = remove;
