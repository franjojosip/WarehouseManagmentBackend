const Location = require("../schema");

async function list(req, res) {
  try {
    let locations = await Location.find({}).populate("city_id", { name: 1, zip_code: 1 }).sort({ city_name: 'asc' });
    locations = locations.map((location) => { 
      return {
        id: location.id,
        name: location.street,
        city_id: location.city_id.id,
        city_name: location.city_id.name,
        zip_code: location.city_id.zip_code
      };
    });
    return res.status(200).json({ locations: locations.sort(compare).sort(deepCompare) });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

function compare(a, b) {
  if (a.city_name[0] < b.city_name[0]) {
    return -1;
  }
  if (a.city_name[0] > b.city_name[0]) {
    return 1;
  }
  return 0;
}

function deepCompare(a, b) {
  if (a.city_name[0] == b.city_name[0] && a.name[0] < b.name[0]) {
    return -1;
  }
  if (a.city_name[0] == b.city_name[0] && a.name[0] > b.name[0]) {
    return 1;
  }
  return 0;
}


module.exports = list;
