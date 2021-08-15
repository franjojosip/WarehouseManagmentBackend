const Packaging = require("../schema");

async function list(req, res) {
  try {
    let packagings = await Packaging.find({}).sort({ name: 'asc'});
    packagings = packagings.map((package) => {
      return {
        id: package.id,
        name: package.name
      };
    });
    return res.status(200).json({ packagings });
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
