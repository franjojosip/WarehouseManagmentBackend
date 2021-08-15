const Role = require("../schema");

async function list(req, res) {
  try {
    let roles = await Role.find({});
    roles = roles.map((role) => {
      return {
        id: role.id,
        name: role.name,
      };
    });
    return res.status(200).json({ roles: roles.sort(compare) });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

function compare(a, b) {
  if (a.name[0] < b.name[0]) {
    return -1;
  }
  if (a.name[0] > b.name[0]) {
    return 1;
  }
  return 0;
}

module.exports = list;
