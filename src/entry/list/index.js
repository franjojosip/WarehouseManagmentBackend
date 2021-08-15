const Entry = require("../schema");
const Location = require("../../location/schema");
const Product = require("../../product/schema");
const Warehouse = require("../../warehouse/schema");
const User = require("../../users/schema");

async function list(req, res) {
  try {
    let entries = [];
    let user = await User.findOne({ _id: req.body.userId }).populate("role_id", { name: 1 });
    if (user.role_id.name.toLowerCase() == "administrator") {
      entries = await Entry.find({}).populate("warehouse_id", { name: 1, location_id: 1 }).populate("product_id", { name: 1 }).populate("user_id").sort({ createdAt: 'desc'});
    }
    else {
      let userWarehouseIds = await Warehouse.find({ user_ids: user.id });
      if (userWarehouseIds.length > 0) {
        let ids = userWarehouseIds.map(warehouse => warehouse.id);
        entries = await Entry.find({ warehouse_id: { $in: ids } }).populate("warehouse_id", { name: 1, location_id: 1 }).populate("product_id", { name: 1 }).populate("user_id").sort({ createdAt: 'desc'});
      }
    }
    let products = await Product.find({}).populate("category_id", { name: 1 }).populate("subcategory_id", { name: 1 }).populate("packaging_id", { name: 1 });
    let locations = await Location.find({}).populate("city_id", { name: 1 });

    entries = entries.map((entry) => {

      let product = products.find(product => product.id == entry.product_id.id);
      let location = locations.find(location => location.id == entry.warehouse_id.location_id);

      return {
        id: entry.id,
        warehouse_id: entry.warehouse_id.id,
        warehouse_name: entry.warehouse_id.name,
        location_id: location.id,
        location_name: location.street,
        city_id: location.city_id.id,
        city_name: location.city_id.name,
        product_id: entry.product_id.id,
        product_name: entry.product_id.name,
        category_id: product.category_id ? product.category_id.id : "",
        category_name: product.category_id ? product.category_id.name : "",
        subcategory_id: product.subcategory_id ? product.subcategory_id.id : "",
        subcategory_name: product.subcategory_id ? product.subcategory_id.name : "",
        packaging_id: product.packaging_id ? product.packaging_id.id : "",
        packaging_name: product.packaging_id ? product.packaging_id.name : "",
        user_id: entry.user_id.id,
        quantity: entry.quantity,
        date_created: entry.createdAt,
        isSubmitted: entry.isSubmitted
      };
    });
    return res.status(200).json({ entries });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = list;
