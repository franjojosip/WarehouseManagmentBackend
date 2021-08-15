const NotificationLog = require("../schema");

async function remove(req, res) {
  try {
    const savedNotificationLog = await NotificationLog.findById(req.params.id);
    if (savedNotificationLog) {
      await NotificationLog.findByIdAndRemove(req.params.id);
      return res.status(200).json({ status: "Uspješno obrisan tip obavijesti!" });
    } else {
      return res.status(404).json({ error: "Tip obavijesti nije pronađen!" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = remove;
