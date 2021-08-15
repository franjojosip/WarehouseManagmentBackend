const Location = require("../schema");
const City = require("../../city/schema");
const Joi = require("joi");

const serializer = Joi.object({
  name: Joi.string().required(),
  city_id: Joi.string().length(24).required(),
});

async function add(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }

    const locationExists = await Location.findOne({ street: result.value.name });
    const cityExists = await City.findOne({ _id: result.value.city_id });

    if (locationExists) {
      return res.status(400).json({ error: "Lokacija s istim imenom se već koristi!" });
    }
    if (!cityExists) {
      return res.status(404).json({ error: "Grad nije pronađen!" });
    }

    const newLocation = new Location();
    newLocation.street = result.value.name;
    newLocation.city_id = result.value.city_id;

    await newLocation.save();
    return res.status(200).json({ status: "Uspješno dodana lokacija!" });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = add;
