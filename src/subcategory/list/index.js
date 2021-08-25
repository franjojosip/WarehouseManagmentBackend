const Subcategory = require("../schema");

async function list(req, res) {
  try {
    let subcategories = await Subcategory.find({}).populate("category_id", { name: 1 }).sort({ name: 'asc'});
    subcategories = subcategories.map((subcategory) => {
      return {
        id: subcategory.id,
        name: subcategory.name,
        category_id: subcategory.category_id.id,
        category_name: subcategory.category_id.name
      };
    });
    return res.status(200).json({ subcategories: subcategories.sort(compareCategory).sort(compareSubcategory) });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

function compareCategory(a, b) {
  if (a.category_name < b.category_name) {
    return -1;
  }
  if (a.category_name > b.category_name) {
    return 1;
  }
  return 0;
}

function compareSubcategory(a, b) {
  if (a.category_name == b.category_name && a.name < b.name) {
    return -1;
  }
  if (a.category_name == b.category_name && a.name > b.name) {
    return 1;
  }
  return 0;
}

module.exports = list;
