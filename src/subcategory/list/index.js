const Subcategory = require("../schema");

async function list(req, res) {
  try {
    let subcategories = await Subcategory.find({}).populate("category_id", { name: 1 });
    subcategories = subcategories.map((subcategory) => {
      return {
        id: subcategory.id,
        name: subcategory.name,
        category_id: subcategory.category_id.id,
        category_name: subcategory.category_id.name
      };
    });
    return res.status(200).json({ subcategories: subcategories.sort(compare).sort(deepCompare) });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

function compare(a, b) {
  if (a.category_name[0] < b.category_name[0]) {
    return -1;
  }
  if (a.category_name[0] > b.category_name[0]) {
    return 1;
  }
  return 0;
}

function deepCompare(a, b) {
  if (a.category_name[0] == b.category_name[0] && a.name[0] < b.name[0]) {
    return -1;
  }
  if (a.category_name[0] == b.category_name[0] && a.name[0] > b.name[0]) {
    return 1;
  }
  return 0;
}

module.exports = list;
