const Stocktaking = require("../schema");
const Warehouse = require("../../warehouse/schema");
const Product = require("../../product/schema");
const Stock = require("../../stock/schema");
const User = require("../../users/schema");
const Joi = require("joi");

const serializer = Joi.object({
  warehouse_id: Joi.string().length(24).required(),
  product_id: Joi.string().length(24).required(),
  user_id: Joi.string().length(24).required(),
  counted_quantity: Joi.number().positive().required()
});

async function edit(req, res) {
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
    const savedStocktaking = await Stocktaking.findById(req.params.id);
    if (savedStocktaking.product_id != result.value.product_id) {

      const currentStock = await Stock.findOne({ warehouse_id: result.value.warehouse_id, product_id: result.value.product_id });
      if (!currentStock) {
        return res.status(404).json({ error: "Proizvod se ne nalazi u odabranom skladištu!" });
      }

      await Stocktaking.findByIdAndUpdate(req.params.id, {
        warehouse_id: result.value.warehouse_id,
        product_id: result.value.product_id,
        user_id: result.value.user_id,
        counted_quantity: result.value.counted_quantity,
        real_quantity: currentStock.quantity
      });
    }
    else {
      await Stocktaking.findByIdAndUpdate(req.params.id, {
        warehouse_id: result.value.warehouse_id,
        product_id: result.value.product_id,
        user_id: result.value.user_id,
        counted_quantity: result.value.counted_quantity
      });
    }
    return res.status(200).json({ status: "Uspješna izmjena inventure za proizvod: " + productExists.name });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = edit;

