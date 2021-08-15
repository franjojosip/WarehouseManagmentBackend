const NotificationType = require("../schema");
const Joi = require("joi");

const serializer = Joi.object({
  password: Joi.string().required()
});
async function remove(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }

    if (result.value.password != process.env.SUPER_ADMIN_PASSWORD) {
      return res.status(403).json({ error: "Nemate prava pristupa!" });
    }

    const savedNotificationType = await NotificationType.findById(req.params.id);
    if (savedNotificationType) {
      await NotificationType.findByIdAndRemove(req.params.id);
      return res.status(200).json({ status: "Uspješno obrisan tip obavijesti!" });
    } else {
      return res.status(404).json({ error: "Tip obavijesti nije pronađen!" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = remove;
