const User = require("../users/schema");

async function authenticateAdmin(req, res, next) {
  const authorizedUser = await User.findOne({
    _id: req.body.userId,
  }).populate("role_id", { name: 1 });

  if (authorizedUser.role_id.name != "Administrator")
    return res.status(403).json({ error: "Nemate pristup!" });
  delete req.body.userId;
  next();
}

module.exports = authenticateAdmin;
