const Warehouse = require("../schema");
const City = require("../../city/schema");

async function list(req, res) {
  try {
    let warehouses = await Warehouse.find({}).populate("location_id", { street: 1, city_id: 1 }).populate("user_ids", { fname: 1, lname: 1 });
    let cities = await City.find({});
    warehouses = warehouses.map((warehouse) => {
      let users = [];
      if (warehouse.user_ids.length > 0) {
        users = warehouse.user_ids.map((user) => {
          return { id: user.id, name: user.fname + " " + user.lname }
        });
      }
      return {
        id: warehouse.id,
        name: warehouse.name,
        location_id: warehouse.location_id.id,
        location_name: warehouse.location_id.street,
        city_id: warehouse.location_id.city_id,
        city_name: cities.find(city => city.id == warehouse.location_id.city_id).name,
        users: warehouse.user_ids.length > 0 ? users : []
      };
    });
    return res.status(200).json({ warehouses: warehouses.sort(compareCity).sort(compareLocation).sort(compareWarehouse) });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

function compareCity(a, b) {
  if (a.city_name < b.city_name) {
    return -1;
  }
  if (a.city_name > b.city_name) {
    return 1;
  }
  return 0;
}

function compareLocation(a, b) {
  if (a.city_name == b.city_name && a.location_name < b.location_name) {
    return -1;
  }
  if (a.city_name == b.city_name && a.location_name > b.location_name) {
    return 1;
  }
  return 0;
}

function compareWarehouse(a, b) {
  if (a.city_name == b.city_name && a.location_name == b.location_name && a.name < b.name) {
    return -1;
  }
  if (a.city_name == b.city_name && a.location_name == b.location_name && a.name > b.name) {
    return 1;
  }
  return 0;
}

module.exports = list;
