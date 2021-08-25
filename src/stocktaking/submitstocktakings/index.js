const Stocktaking = require("../schema");
const Stock = require("../../stock/schema");
const Joi = require("joi");

const serializer = Joi.object({
  stocktaking_ids: Joi.array().required(),
  userId: Joi.string()
});

async function submitStocktakings(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }
    let isError = false;
    for (const id of result.value.stocktaking_ids) {
      const submittedStocktaking = await Stocktaking.findById(id);
      const currentStock = await Stock.findOne({ warehouse_id: submittedStocktaking.warehouse_id, product_id: submittedStocktaking.product_id });

      if (submittedStocktaking && currentStock) {
        submittedStocktaking.isSubmitted = true;
        submittedStocktaking.real_quantity = currentStock.quantity;

        await submittedStocktaking.save();
      }
      else {
        isError = true;
      }
    };
    if (isError) {
      return res.status(404).json({ error: "Dio proizvoda se ne nalazi na odabranom skladištu, molimo provjerite unose!" });
    } else {
      return res.status(200).json({ status: "Uspješno potvrđene sve inventure!" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = submitStocktakings;
