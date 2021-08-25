const NotificationSetting = require("../schema");
const moment = require("moment");

async function list(req, res) {
  try {
    let notificationSettings = await NotificationSetting.find({}).populate("notification_type_id", { name: 1 });
    notificationSettings = notificationSettings.map((notificationSetting) => {
      return {
        id: notificationSetting.id,
        day_of_week: notificationSetting.day_of_week,
        time: moment(notificationSetting.time).format('HH:mm'),
        notification_type_id: notificationSetting.notification_type_id.id,
        notification_type_name: notificationSetting.notification_type_id.name,
        email: notificationSetting.email,
      };
    });

    return res.status(200).json({ notificationSettings: notificationSettings.sort(compare) });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

function compare(a, b) {
    if (a.notification_type_name < b.notification_type_name) {
        return -1;
    }
    if (a.notification_type_name > b.notification_type_name) {
        return 1;
    }
    return 0;
}

module.exports = list;
