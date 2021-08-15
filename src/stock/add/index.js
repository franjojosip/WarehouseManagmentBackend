const Stock = require("../schema");
const Warehouse = require("../../warehouse/schema");
const Product = require("../../product/schema");
const Joi = require("joi");

const serializer = Joi.object({
  warehouse_id: Joi.string().length(24).required(),
  product_id: Joi.string().length(24).required(),
  quantity: Joi.number().positive().required(),
  minimum_quantity: Joi.number().positive().required()
});

async function add(req, res) {
  try {
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

    const newStock = new Stock();
    newStock.warehouse_id = result.value.warehouse_id;
    newStock.product_id = result.value.product_id;
    newStock.quantity = result.value.quantity;
    newStock.minimum_quantity = result.value.minimum_quantity;

    await newStock.save();
    return res.status(200).json({ status: "Uspješno kreirano stanje u skladištu!" });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = add;
