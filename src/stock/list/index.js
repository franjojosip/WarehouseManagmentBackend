const Stock = require("../schema");
const Location = require("../../location/schema");
const Packaging = require("../../packaging/schema");
const Product = require("../../product/schema");
const Warehouse = require("../../warehouse/schema");
const User = require("../../users/schema");

async function list(req, res) {
  try {
    let stocks = [];
    let user = await User.findOne({ _id: req.body.userId }).populate("role_id", { name: 1 });
    if (user.role_id.name.toLowerCase() == "administrator") {
      stocks = await Stock.find({}).populate("warehouse_id", { name: 1, location_id: 1 }).populate("product_id", { name: 1, packaging_id: 1 });
    }
    else {
      let userWarehouseIds = await Warehouse.find({ user_ids: user.id });
      if (userWarehouseIds.length > 0) {
        let ids = userWarehouseIds.map(warehouse => warehouse.id);
        stocks = await Stock.find({ warehouse_id: { $in: ids } }).populate("warehouse_id", { name: 1, location_id: 1 }).populate("product_id", { name: 1, packaging_id: 1 });
      }
    }

    let locations = await Location.find({}).populate("city_id", { name: 1 });
    let packagings = await Packaging.find({});
    let products = await Product.find({}).populate("category_id", { name: 1 }).populate("subcategory_id", { name: 1 });

    stocks = stocks.map((stock) => {
      let location = locations.find(location => location.id == stock.warehouse_id.location_id);
      let product = products.find(product => product.id == stock.product_id.id);
      let packaging = null;
      if (stock.product_id.packaging_id) {
        packaging = packagings.find(packaging => packaging.id == stock.product_id.packaging_id);
      }
      return {
        id: stock.id,
        city_id: location.city_id.id,
        city_name: location.city_id.name,
        location_id: location.id,
        location_name: location.street,
        warehouse_id: stock.warehouse_id.id,
        warehouse_name: stock.warehouse_id.name,
        product_id: stock.product_id.id,
        product_name: stock.product_id.name,
        category_id: product.category_id.id,
        category_name: product.category_id.name,
        subcategory_id: product.subcategory_id ? product.subcategory_id.id : "",
        subcategory_name: product.subcategory_id ? product.subcategory_id.name : "",
        packaging_id: packaging ? packaging.id : "",
        packaging_name: packaging ? packaging.name : "",
        quantity: stock.quantity,
        min_quantity: stock.minimum_quantity
      };
    });

    return res.status(200).json({ stocks });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = list;
