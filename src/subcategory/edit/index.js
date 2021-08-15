const Subcategory = require("../schema");
const Category = require("../../category/schema");
const Joi = require("joi");

const serializer = Joi.object({
  name: Joi.string().required(),
  category_id: Joi.string().length(24).required(),
});

async function edit(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }

    const categoryExists = await Category.findById(result.value.category_id);
    const subcategory = await Subcategory.findById(req.params.id);

    if (!categoryExists) {
      return res.status(404).json({ error: "Kategorija nije pronađena!" });
    }
    if (!subcategory) {
      return res.status(404).json({ error: "Potkategorija nije pronađena!" });
    }

    subcategory.name = result.value.name;
    subcategory.category_id = result.value.category_id;

    await subcategory.save();
    return res.status(200).json({ status: "Uspješna izmjena potkategorije!" });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = edit;
