const NotificationType = require("../schema");

async function list(req, res) {
  try {
    let types = await NotificationType.find({}).sort({ name: 'asc'});
    types = types.map((type) => {
      return {
        id: type.id,
        name: type.name
      };
    });
    return res.status(200).json({ types });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = list;
