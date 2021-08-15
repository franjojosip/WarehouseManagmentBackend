const Product = require("../schema");
const Category = require("../../category/schema");
const Subcategory = require("../../subcategory/schema");
const Packaging = require("../../packaging/schema");
const Joi = require("joi");

const serializer = Joi.object({
  name: Joi.string().required(),
  category_id: Joi.string().length(24).required(),
  subcategory_id: Joi.string().length(24).allow(null),
  packaging_id: Joi.string().length(24).allow(null),
});

async function add(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }

    let errors = [];
    let isWrongSubcategory = false;

    const categoryExists = await Category.findById(result.value.category_id);
    if (!categoryExists) {
      errors.push("Kategorija");
    }

    if (result.value.packaging_id != null) {
      const packagingExists = await Packaging.findById(result.value.packaging_id);
      if (!packagingExists) {
        errors.push("Ambalaža");
      }
    }

    if (result.value.subcategory_id != null) {
      const subcategoryExists = await Subcategory.findById(result.value.subcategory_id);
      if (!subcategoryExists) {
        errors.push("Potkategorija");
      }
      else if (subcategoryExists.category_id != result.value.category_id) {
        isWrongSubcategory = true;
      }
    }

    if (errors.length > 0) {
      if (isWrongSubcategory) {
        return res.status(404).json({ error: `Pogrešna potkategorija i ${errors.join(", ")} nije pronađena!` });
      }
      else {
        return res.status(404).json({ error: `${errors.join(", ")} nije pronađena!` });
      }
    }
    else if (isWrongSubcategory) {
      return res.status(404).json({ error: "Pogrešna potkategorija!" });
    }

    const productExists = await Product.findOne({ name: result.value.name });
    if (productExists) {
      return res.status(400).json({ error: "Naziv proizvoda se već koristi!" });
    }

    const newProduct = new Product();
    newProduct.name = result.value.name;
    newProduct.category_id = result.value.category_id;
    newProduct.subcategory_id = result.value.subcategory_id;
    newProduct.packaging_id = result.value.packaging_id;

    await newProduct.save();
    return res.status(200).json({ status: "Uspješno kreiran proizvod!" });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = add;
