const City = require("../schema");

async function list(req, res) {
  try {
    let cities = await City.find({}).sort({ name: 'asc'});
    let gradovi = cities.map((city) => {
      return {
        id: city.id,
        naziv: city.name,
        postanski_broj: city.zip_code,
      };
    });
    return res.status(200).json({ gradovi });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}
module.exports = list;
