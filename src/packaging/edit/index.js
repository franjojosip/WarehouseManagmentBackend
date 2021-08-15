const Packaging = require("../schema");
const Joi = require("joi");

const serializer = Joi.object({
  name: Joi.string().required()
});

async function edit(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }

    const packaging = await Packaging.findById(req.params.id);

    if (packaging.name.toLowerCase() != result.value.name.toLowerCase()) {
      const nameExists = await Packaging.findOne({ name: result.value.name });
      if (nameExists) {
        return res.status(400).json({ error: "Ambalaža već postoji!" });
      }
    }

    await Packaging.findByIdAndUpdate(req.params.id, {
      name: result.value.name
    });
    return res.status(200).json({ status: "Uspješna izmjena ambalaže!" });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = edit;
