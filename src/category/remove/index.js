const Category = require("../schema");
const Subcategory = require("../../subcategory/schema");
const Product = require("../../product/schema");

async function remove(req, res) {
  try {
    const savedCategory = await Category.findById(req.params.id);
    if (savedCategory) {
      const subcategories = await Subcategory.find({ category_id: req.params.id });
      const products = await Product.find({ category_id: req.params.id });

      if (subcategories.length > 0) {
        return res.status(400).json({ error: "Postoje potkategorije povezane s ovom kategorijom!" });
      }
      else if (products.length > 0) {
        return res.status(400).json({ error: "Postoje proizvodi povezani s ovom kategorijom!" });
      }
      else {
        await Category.findByIdAndRemove(req.params.id);
        return res.status(200).json({ status: "Uspješno obrisana kategorija!" });
      }
    } else {
      return res.status(404).json({ error: "Kategorija nije pronađena!" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = remove;
