const City = require("../schema");
const Joi = require("joi");

const serializer = Joi.object({
  name: Joi.string().required(),
  zip_code: Joi.number().required(),
});

async function add(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }

    const zipCodeExists = await City.findOne({ zip_code: result.value.zip_code });
    if (zipCodeExists) {
      return res.status(400).json({ error: "Poštanski broj se već koristi!" });
    }
    const newCity = new City();
    newCity.name = result.value.name;
    newCity.zip_code = result.value.zip_code;

    await newCity.save();
    return res.status(200).json({ status: "Uspješno dodan grad!" });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = add;
