const Reciept = require("../schema");
const Warehouse = require("../../warehouse/schema");
const Product = require("../../product/schema");
const User = require("../../users/schema");
const Joi = require("joi");

const serializer = Joi.object({
  warehouse_id: Joi.string().length(24).required(),
  product_id: Joi.string().length(24).required(),
  user_id: Joi.string().length(24).required(),
  quantity: Joi.number().positive().required()
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

    const newReciept = new Reciept();
    newReciept.warehouse_id = result.value.warehouse_id;
    newReciept.product_id = result.value.product_id;
    newReciept.user_id = result.value.user_id;
    newReciept.quantity = result.value.quantity;

    await newReciept.save();
    return res.status(200).json({ status: "Uspješno kreirano preuzimanje" });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = add;
