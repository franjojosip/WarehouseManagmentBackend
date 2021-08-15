const Category = require("../schema");

async function list(req, res) {
  try {
    let categories = await Category.find({}).sort({ name: 'asc'});
    categories = categories.map((category) => {
      return {
        id: category.id,
        name: category.name,
      };
    });
    return res.status(200).json({ categories });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = list;
