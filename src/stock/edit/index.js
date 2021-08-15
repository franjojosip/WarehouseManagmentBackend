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

async function edit(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }

    const stockExists = await Stock.findById(req.params.id);
    if (!stockExists) {
      return res.status(400).json({ error: "Unos na stanje nije pronađen!" });
    }

    const warehouseExists = await Warehouse.findById(result.value.warehouse_id);
    if (!warehouseExists) {
      return res.status(400).json({ error: "Skladište nije pronađeno!" });
    }

    const productExists = await Product.findById(result.value.product_id);
    if (!productExists) {
      return res.status(400).json({ error: "Proizvod nije pronađen" });
    }
    await Stock.findByIdAndUpdate(req.params.id, {
      warehouse_id: result.value.warehouse_id,
      product_id: result.value.product_id,
      quantity: result.value.quantity,
      minimum_quantity: result.value.minimum_quantity
    });
    return res.status(200).json({ status: "Uspješna izmjena unosa na stanje!" });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = edit;
