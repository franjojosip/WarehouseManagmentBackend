const Role = require("../schema");
const Joi = require("joi");

const serializer = Joi.object({
  name: Joi.string().required(),
  password: Joi.string().required()
});

async function edit(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }

    if (result.value.password != process.env.SUPER_ADMIN_PASSWORD) {
      return res.status(403).json({ error: "Nemate prava pristupa!" });
    }

    let value = await Role.findByIdAndUpdate(req.params.id, {
      name: result.value.name,
    });
    if (value) {
      return res.status(200).json({ status: "Uspješna izmjena uloge!" });
    }
    else {
      return res.status(404).json({ error: "Uloga nije pronađena!" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = edit;
