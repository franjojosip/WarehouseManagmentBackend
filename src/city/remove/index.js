const City = require("../schema");
const Location = require("../../location/schema");

async function remove(req, res) {
  try {
    const savedCity = await City.findById(req.params.id);
    if (savedCity) {
      const locations = await Location.find({ city_id: req.params.id });

      if (locations.length > 0) {
        return res.status(400).json({ error: "Postoje lokacije povezane s ovim gradom!" });
      } else {
        await City.findByIdAndRemove(req.params.id);
        return res.status(200).json({ status: "Uspješno obrisan grad!" });
      }
    } else {
      return res.status(404).json({ error: "Grad nije pronađen!" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = remove;
