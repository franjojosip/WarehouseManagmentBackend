const Reciept = require("../schema");
const Location = require("../../location/schema");
const Product = require("../../product/schema");
const User = require("../../users/schema");

async function list(req, res) {
  try {
    let reciepts = [];
    let user = await User.findOne({ _id: req.body.userId }).populate("role_id", { name: 1 });
    if (user.role_id.name.toLowerCase() == "administrator") {
      reciepts = await Reciept.find({})
        .populate("warehouse_id", { name: 1, location_id: 1 })
        .populate("product_id", { name: 1 })
        .populate("user_id", { fname: 1, lname: 1 })
        .sort({ createdAt: 'desc' });
    }
    else {
      reciepts = await Reciept.find({ user_id: req.body.userId })
        .populate("warehouse_id", { name: 1, location_id: 1 })
        .populate("product_id", { name: 1 })
        .populate("user_id", { fname: 1, lname: 1 })
        .sort({ createdAt: 'desc' });
    }

    let locations = await Location.find({}).populate("city_id", { name: 1 });
    let products = await Product.find({}).populate("category_id", { name: 1 }).populate("subcategory_id", { name: 1 }).populate("packaging_id", { name: 1 });

    reciepts = reciepts.map((reciept) => {
      let location = locations.find(location => location.id == reciept.warehouse_id.location_id);
      let product = products.find(product => product.id == reciept.product_id.id);

      return {
        id: reciept.id,
        warehouse_id: reciept.warehouse_id.id,
        warehouse_name: reciept.warehouse_id.name,
        city_id: location.city_id.id,
        city_name: location.city_id.name,
        location_id: location.id,
        location_name: location.street,
        product_id: product.id,
        product_name: product.name,
        category_id: product.category_id.id,
        category_name: product.category_id.name,
        subcategory_id: product.subcategory_id ? product.subcategory_id.id : "",
        subcategory_name: product.subcategory_id ? product.subcategory_id.name : "",
        packaging_id: product.packaging_id.id,
        packaging_name: product.packaging_id.name,
        user_id: reciept.user_id.id,
        user_name: reciept.user_id.fname + " " + reciept.user_id.fname,
        quantity: reciept.quantity,
        date_created: reciept.createdAt,
        isSubmitted: reciept.isSubmitted
      };
    });
    return res.status(200).json({ reciepts });
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
  if (a.city_name[0] == b.city_name[0] && a.location_name[0] < b.location_name[0]) {
    return -1;
  }
  if (a.city_name[0] == b.city_name[0] && a.location_name[0] > b.location_name[0]) {
    return 1;
  }
  return 0;
}


module.exports = list;
