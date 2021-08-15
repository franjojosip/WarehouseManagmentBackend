const User = require("../schema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");

const serializer = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

async function login(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }

    const user = await User.findOne({ email: result.value.email }).populate("role_id", { name: 1 });
    if (!user) return res.status(401).json({ error: "Neispravni korisnički podatci!" });

    const passwordHash = user.password;
    if (bcrypt.compareSync(result.value.password, passwordHash)) {
      const payload = {
        user: {
          id: user.id,
        },
      };
      const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_LIFE,
      });
      const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET);
      user.refreshToken = refreshToken;

      await user.save();

      return res.status(200).json({
        user: {
          id: user.id,
          fname: user.fname,
          lname: user.lname,
          email: user.email,
          role: user.role_id.name,
          accessToken,
          refreshToken: user.refreshToken,
        },
      });
    }
    return res.status(401).json({ error: "Neispravni korisnički podatci!" });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = login;
