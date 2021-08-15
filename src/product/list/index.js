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
        packaging_id: product.packaging_id.id,
        packaging_name: product.packaging_id.name
      };
      if (product.subcategory_id != null) {
        object.subcategory_id = product.subcategory_id.id;
        object.subcategory_name = product.subcategory_id.name;
      }
      return object;
    });
    return res.status(200).json({ products });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = list;
