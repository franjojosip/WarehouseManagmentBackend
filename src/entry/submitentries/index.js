const Entry = require("../schema");
const Stock = require("../../stock/schema");
const Joi = require("joi");

const serializer = Joi.object({
  entry_ids: Joi.array().required(),
  userId: Joi.string()
});

async function submitEntries(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }
    let isError = false;
    for (const id of result.value.entry_ids) {
      const submittedEntry = await Entry.findById(id);
      const currentStock = await Stock.findOne({ warehouse_id: submittedEntry.warehouse_id, product_id: submittedEntry.product_id });

      if (submittedEntry && currentStock) {
        let oldQuantity = currentStock.quantity;

        submittedEntry.isSubmitted = true;
        submittedEntry.old_quantity = oldQuantity;
        currentStock.quantity = oldQuantity + submittedEntry.quantity;

        await submittedEntry.save();
        await currentStock.save();
      }
      else {
        isError = true;
      }
    };
    if (isError) {
      return res.status(404).json({ error: "Dio proizvoda se ne nalazi na odabranom skladištu, molimo provjerite unose!" });
    } else {
      return res.status(200).json({ status: "Uspješno potvrđeni svi unosi!" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = submitEntries;
