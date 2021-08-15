async function checkParamID(req, res, next) {
  const id = req.params.id;
  if (id == null || id.length != 24) return res.status(400).json({ error: "Neispravan ID" });
  next();
}

module.exports = checkParamID;
