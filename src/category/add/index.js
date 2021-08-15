const Category = require("../schema");
const Joi = require("joi");

const serializer = Joi.object({
  name: Joi.string().required(),
});

async function add(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }

    const categoryExists = await Category.findOne({ name: result.value.name });
    if (categoryExists) {
      return res.status(400).json({ error: "Kategorija s istim nazivom već postoji!" });
    }
    const newCategory = new Category();
    newCategory.name = result.value.name;

    await newCategory.save();
    return res.status(200).json({ status: "Uspješno spremljena kategorija!" });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = add;
