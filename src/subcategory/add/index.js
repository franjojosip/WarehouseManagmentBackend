const Subcategory = require("../schema");
const Category = require("../../category/schema");
const Joi = require("joi");

const serializer = Joi.object({
  name: Joi.string().required(),
  category_id: Joi.string().length(24).required(),
});

async function add(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }

    const categoryExists = await Category.findById(result.value.category_id);
    const subcategoryExists = await Subcategory.findOne({ name: result.value.name });

    if (!categoryExists) {
      return res.status(404).json({ error: "Kategorija nije pronađena!" });
    }
    if (subcategoryExists) {
      return res.status(400).json({ error: "Potkategorija s istim nazivom već postoji!" });
    }

    const newSubcategory = new Subcategory();
    newSubcategory.name = result.value.name;
    newSubcategory.category_id = result.value.category_id;

    await newSubcategory.save();
    return res.status(200).json({ status: "Uspješno kreirana potkategorija!" });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = add;
