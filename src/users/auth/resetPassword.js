const User = require("../schema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const PaswordRequest = require("../passwordRequestSchema");

const serializer = Joi.object({
  token: Joi.string().length(24).required(),
  old_password: Joi.string().required(),
  new_password: Joi.string().required(),
});

async function resetPassword(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }
    const paswordRequest = await PaswordRequest.findOne({ _id: result.value.token });

    if(!paswordRequest){
        return res.status(404).json({ error: "Zahtjev nije pronađen!" });
    }
    if(paswordRequest.isUsed){
        return res.status(400).json({ error: "Zahtjev za resetiranje lozinke je istekao!" });
    }


    const user = await User.findOne({ _id: paswordRequest.user_id });
    if (!user) return res.status(401).json({ error: "Neispravni korisnički podatci!" });

    const passwordHash = user.password;
    if (bcrypt.compareSync(result.value.old_password, passwordHash)) {
        
      const passwordHash = bcrypt.hashSync(result.value.new_password, 10);
      user.refreshToken = "";
      user.password = passwordHash;
      await user.save();

      paswordRequest.isUsed = true;
      await paswordRequest.save();

      return res.status(200).json({
          status: "Uspješna izmjena lozinke!"
      });
    }
    return res.status(401).json({ error: "Neispravni korisnički podatci!" });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = resetPassword;
