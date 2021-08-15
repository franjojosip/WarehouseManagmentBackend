const NotificationSetting = require("../schema");
const Joi = require("joi");
const moment = require("moment");

const serializer = Joi.object({
  day_of_week: Joi.number().required(),
  time: Joi.string().required(),
  notification_type_id: Joi.string().required(),
  email: Joi.string().required()
});

async function add(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }
    let time = moment("2021/01/01 " + result.value.time, 'YYYY/MM/DD HH:mm');
    const newNotificationSetting = new NotificationSetting();
    newNotificationSetting.day_of_week = result.value.day_of_week;
    newNotificationSetting.time = moment(time);
    newNotificationSetting.notification_type_id = result.value.notification_type_id;
    newNotificationSetting.email = result.value.email;

    await newNotificationSetting.save();
    return res.status(200).json({ status: "Uspješno kreiran postavka automatske obavijesti!" });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = add;
