const Warehouse = require("../schema");
const Location = require("../../location/schema");
const Joi = require("joi");

const serializer = Joi.object({
  name: Joi.string().required(),
  location_id: Joi.string().length(24).required(),
  users: Joi.array(),
});

async function edit(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }

    const locationExists = await Location.findById(result.value.location_id);
    if (!locationExists) {
      return res.status(400).json({ error: "Lokacija nije pronađena!" });
    }

    let isUserIDWrong = false;
    if (result.value.users.length > 0) {
      result.value.users.forEach((user_id) => {
        if (user_id.length != 24) {
          isUserIDWrong = true;
        }
      });
    }
    if (isUserIDWrong) {
      return res.status(400).json({ error: "Provjerite korisnike!" });
    }

    await Warehouse.findByIdAndUpdate(req.params.id, {
      name: result.value.name,
      location_id: result.value.location_id,
      user_ids: result.value.users,
    });
    return res.status(200).json({ status: "Uspješna izmjena skladišta!" });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = edit;
