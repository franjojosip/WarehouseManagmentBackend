const User = require("../schema");
const Joi = require("joi");

const serializer = Joi.object({
  fname: Joi.string().required(),
  lname: Joi.string().required(),
  email: Joi.string().required(),
  phone: Joi.string().required(),
  role_id: Joi.string().length(24).required(),
});

async function edit(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }

    const user = await User.findById(req.params.id);
    if (user.email.toLowerCase() != result.value.email.toLowerCase()) {
      const userExist = await User.findOne({ email: result.value.email });
      if (userExist) {
        return res.status(400).json({ error: "Email je već u upotrebi!" });
      }
    }

    await User.findByIdAndUpdate(req.params.id, {
      fname: result.value.fname,
      lname: result.value.lname,
      email: result.value.email,
      phone: result.value.phone,
      role_id: result.value.role_id,
    });
    return res.status(200).json({ status: "Uspješna izmjena korisnika!" });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = edit;
