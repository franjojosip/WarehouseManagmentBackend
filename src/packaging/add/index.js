const Packaging = require("../schema");
const Joi = require("joi");

const serializer = Joi.object({
  name: Joi.string().required()
});

async function add(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }

    const savedPackaging = await Packaging.findOne({ name: result.value.name });
    if (savedPackaging) {
      return res.status(400).json({ error: "Ambalaža s istim imenom se već koristi!" });
    }
    const newPackaging = new Packaging();
    newPackaging.name = result.value.name;

    await newPackaging.save();
    return res.status(200).json({ status: "Uspješno dodana ambalaža!" });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = add;
