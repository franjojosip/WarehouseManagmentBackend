const User = require("../schema");
const Role = require("../../role/schema");
const bcrypt = require("bcryptjs");
const Joi = require("joi");

const serializer = Joi.object({
  fname: Joi.string().required(),
  lname: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role_id: Joi.string(),
  phone: Joi.string().required(),
});

async function register(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }

    const userExists = await User.findOne({ email: result.value.email });
    if (userExists) {
      return res.status(400).json({ error: "Email je u upotrebi!" });
    }
    const newUser = new User();
    const passwordHash = bcrypt.hashSync(result.value.password, 10);

    const roles = await Role.find({});

    if (result.value.role_id && result.value.role_id.length == 24) {
      const foundRole = await Role.findById(result.value.role_id);
      if (!foundRole) {
        return res.status(404).json({ error: "Nije pronađena uloga!" });
      }
    }
    else {
      result.value.role_id = getRoleId("Radnik", roles);
    }

    newUser.fname = result.value.fname;
    newUser.lname = result.value.lname;
    newUser.email = result.value.email;
    newUser.role_id = result.value.role_id;
    newUser.phone = result.value.phone;
    newUser.password = passwordHash;

    await newUser.save();
    return res.status(200).json({ status: "Uspješno kreiran korisnik!" });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

function getRoleId(name, roles) {
  return roles.filter((role) => {
    return role.name.toLowerCase() == name.toLowerCase();
  })[0]._id;
}

module.exports = register;
