const Role = require("../schema");
const User = require("../../users/schema");

async function remove(req, res) {
  try {
    if (req.body.password == null || req.body.password != process.env.SUPER_ADMIN_PASSWORD) {
      return res.status(403).json({ error: "Neispravna lozinka!" });
    }
    const savedRole = await Role.findById(req.params.id);
    if (savedRole) {
      const users = User.find({ role_id: savedRole._id });
      if (users.length > 0) {
        return res.status(400).json({ error: "Postoje korisnici povezani s ovom ulogom!" });
      } else {
        await Role.findByIdAndRemove(req.params.id);
        return res.status(200).json({ status: "Uspješno obrisana uloga!" });
      }
    } else {
      return res.status(404).json({ error: "Uloga nije pronađena!" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = remove;
