const NotificationLog = require("../schema");
const Joi = require("joi");

const serializer = Joi.object({
  notification_type_id: Joi.string().length(24).required(),
  subject: Joi.string().required(),
  email: Joi.string().required(),
  data: Joi.string().required(),
});

async function add(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }

    const newNotificationLog = new NotificationLog();
    newNotificationLog.notification_type_id = result.value.notification_type_id;
    newNotificationLog.subject = result.value.subject;
    newNotificationLog.email = result.value.email;
    newNotificationLog.data = result.value.data;

    await newNotificationLog.save();
    return res.status(200).json({ status: "Uspješno kreirana informacija o obavijesti!" });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = add;
