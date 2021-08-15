const NotificationLog = require("../schema");

async function list(req, res) {
  try {
    let notificationLogs = await NotificationLog.find({}).populate("notification_type_id").sort({ createdAt: 'desc' });
    notificationLogs = notificationLogs.map((log) => {
      return {
        id: log.id,
        notification_type_id: log.notification_type_id.id,
        notification_type_name: log.notification_type_id.name,
        subject: log.subject,
        email: log.email,
        data: log.data,
        date_created: log.createdAt
      };
    });
    return res.status(200).json({ notificationLogs });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = list;
