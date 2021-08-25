const Role = require("../schema");

async function list(req, res) {
  try {
    let roles = await Role.find({}).sort({ name: 'asc'});;
    roles = roles.map((role) => {
      return {
        id: role.id,
        name: role.name,
      };
    });
    return res.status(200).json({ roles });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = list;
