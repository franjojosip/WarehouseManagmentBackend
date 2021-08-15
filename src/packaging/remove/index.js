const Packaging = require("../schema");
const Product = require("../../product/schema");

async function remove(req, res) {
  try {
    const savedPackage = await Packaging.findById(req.params.id);
    if (savedPackage) {
      const products = await Product.find({ packaging_id: req.params.id });
      if (products.length > 0) {
        return res.status(400).json({ error: "Postoje proizvodi povezani s ovom ambalažom!" });
      }
      else {
        await Packaging.findByIdAndRemove(req.params.id);
        return res.status(200).json({ status: "Uspješno obrisana ambalaža!" });
      }
    }
    else {
      return res.status(404).json({ error: "Ambalaža nije pronađena!" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = remove;
