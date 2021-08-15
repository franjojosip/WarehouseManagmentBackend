const Subcategory = require("../schema");
const Product = require("../../product/schema");

async function remove(req, res) {
  try {
    const savedSubcategory = await Subcategory.findById(req.params.id);

    if (savedSubcategory) {
      const products = await Product.find({ subcategory_id: req.params.id });

      if (products.length > 0) {
        return res.status(400).json({ error: "Postoje proizvodi povezani s ovom potkategorijom!" });
      }
      else {
        await Subcategory.findByIdAndRemove(req.params.id);
        return res.status(200).json({ status: "Uspješno obrisana potkategorija!" });
      }
    } else {
      return res.status(404).json({ error: "Potkategorija nije pronađena!" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = remove;
