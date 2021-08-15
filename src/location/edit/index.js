const Location = require("../schema");
const City = require("../../city/schema");
const Joi = require("joi");

const serializer = Joi.object({
  name: Joi.string().required(),
  city_id: Joi.string().length(24).required(),
});

async function edit(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }

    const cityExists = await City.findOne({ _id: result.value.city_id });
    const location = await Location.findOne({ _id: req.params.id });

    if (!cityExists) {
      return res.status(404).json({ error: "Grad nije pronađen!" });
    }
    if (!location) {
      return res.status(404).json({ error: "Lokacija nije pronađena!" });
    }

    location.street = result.value.name;
    location.city_id = result.value.city_id;

    await location.save();
    return res.status(200).json({ status: "Uspješna izmjena lokacije!" });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = edit;
