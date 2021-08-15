const User = require("../schema");

async function list(req, res) {
  try {
    let users = await User.find({}).populate("role_id", { name: 1 });
    users = users.map((user) => {
      return {
        id: user.id,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        phone: user.phone,
        role_id: user.role_id.id,
        role_name: user.role_id.name
      };
    });
    return res.status(200).json({ users });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = list;
