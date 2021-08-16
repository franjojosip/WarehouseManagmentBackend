const NotificationSetting = require("../schema");
const Joi = require("joi");
const moment = require("moment");

const serializer = Joi.object({
  day_of_week: Joi.number().required(),
  time: Joi.string().required(),
  notification_type_id: Joi.string().required(),
  email: Joi.string().required()
});

async function edit(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }

    const notificationSetting = await NotificationSetting.findById(req.params.id);
    if (!notificationSetting) {
      return res.status(404).json({ error: "Nije pronađena postavka automatske obavijesti!" });
    }
    notificationSetting.day_of_week = result.value.day_of_week;
    notificationSetting.time = moment(new Date("2021/01/01 " + result.value.time), 'YYYY/MM/DD HH:mm');
    notificationSetting.notification_type_id = result.value.notification_type_id;
    notificationSetting.email = result.value.email;

    await notificationSetting.save();
    return res.status(200).json({ status: "Uspješno izmjenjena automatska obavijest!" });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = edit;
