const Stocktaking = require("../schema");
const Warehouse = require("../../warehouse/schema");
const Product = require("../../product/schema");
const User = require("../../users/schema");
const Stock = require("../../stock/schema");
const Joi = require("joi");

const serializer = Joi.object({
  warehouse_id: Joi.string().length(24).required(),
  product_id: Joi.string().length(24).required(),
  user_id: Joi.string().length(24).required(),
  counted_quantity: Joi.number().positive().required()
});

async function add(req, res) {
  try {
    req.body.user_id = req.body.userId;
    delete req.body.userId;
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }

    const warehouseExists = await Warehouse.findById(result.value.warehouse_id);
    if (!warehouseExists) {
      return res.status(400).json({ error: "Skladište nije pronađeno!" });
    }
    const productExists = await Product.findById(result.value.product_id);
    if (!productExists) {
      return res.status(400).json({ error: "Proizvod nije pronađen!" });
    }
    const userExists = await User.findById(result.value.user_id);
    if (!userExists) {
      return res.status(400).json({ error: "Korisnik nije pronađen!" });
    }

    const currentStock = await Stock.findOne({ warehouse_id: result.value.warehouse_id, product_id: result.value.product_id });
    if (!currentStock) {
      return res.status(404).json({ error: "Proizvod se ne nalazi u odabranom skladištu!" });
    }

    const newStocktaking = new Stocktaking();
    newStocktaking.warehouse_id = result.value.warehouse_id;
    newStocktaking.product_id = result.value.product_id;
    newStocktaking.user_id = result.value.user_id;
    newStocktaking.counted_quantity = result.value.counted_quantity;
    newStocktaking.real_quantity = currentStock.quantity;

    await newStocktaking.save();
    return res.status(200).json({ status: "Uspješno kreirana inventura za proizvod: " + productExists.name });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = add;
