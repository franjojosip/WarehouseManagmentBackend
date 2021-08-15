const Entry = require("../schema");

async function remove(req, res) {
  try {
    const savedEntry = await Entry.findById(req.params.id);
    if (savedEntry) {
      await Entry.findByIdAndRemove(req.params.id);
      return res.status(200).json({ status: "Uspješno obrisan unos!" });
    } else {
      return res.status(404).json({ error: "Unos nije pronađen!" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = remove;
