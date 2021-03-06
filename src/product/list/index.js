const Product = require("../schema");

async function list(req, res) {
  try {
    let products = await Product.find({})
      .populate("packaging_id", { name: 1 })
      .populate("category_id", { name: 1 })
      .populate("subcategory_id", { name: 1 })
      .sort({ name: 'asc' });

    products = products.map((product) => {
      let object = {
        id: product.id,
        name: product.name,
        category_id: product.category_id.id,
        category_name: product.category_id.name,
        subcategory_id: product.subcategory_id ? product.subcategory_id.id : "",
        subcategory_name: product.subcategory_id ? product.subcategory_id.name : "",
        packaging_id: product.packaging_id.id,
        packaging_name: product.packaging_id.name
      };
      return object;
    });
    return res.status(200).json({ products: products.sort(compare).sort(deepCompare).sort(packagingCompare) });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

function compare(a, b) {
  if (a.category_name < b.category_name) {
    return -1;
  }
  if (a.category_name > b.category_name) {
    return 1;
  }
  return 0;
}

function deepCompare(a, b) {
  if (a.category_name == b.category_name && a.subcategory_name < b.subcategory_name) {
    return -1;
  }
  if (a.category_name == b.category_name && a.subcategory_name > b.subcategory_name) {
    return 1;
  }
  return 0;
}

function packagingCompare(a, b) {
  if (a.category_name == b.category_name && a.subcategory_name == b.subcategory_name && a.name < b.name) {
    return -1;
  }
  if (a.category_name == b.category_name && a.subcategory_name == b.subcategory_name && a.name > b.name) {
    return 1;
  }
  return 0;
}

function nameCompare(a, b) {
  if (a.category_name == b.category_name && a.subcategory_name == b.subcategory_name && a.packaging_name == b.packaging_name && a.name < b.name) {
    return -1;
  }
  if (a.category_name == b.category_name && a.subcategory_name == b.subcategory_name && a.packaging_name == b.packaging_name && a.name > b.name) {
    return 1;
  }
  return 0;
}

module.exports = list;
