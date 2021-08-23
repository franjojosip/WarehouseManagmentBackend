const Entry = require("../schema");
const Stock = require("../../stock/schema");
const Joi = require("joi");
var asyncLoop = require('node-async-loop');

const serializer = Joi.object({
  entry_ids: Joi.array().required(),
  userId: Joi.string()
});

async function submitEntries(req, res) {
  console.log(req.body);
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }
    let isError = false;
    await result.value.entry_ids.length.forEach((id) => {

      const submittedEntry = await Entry.findById(id);
      const currentStock = await Stock.findOne({ warehouse_id: submittedEntry.warehouse_id, product_id: submittedEntry.product_id });

      if (submittedEntry && currentStock) {
        console.log("submitted");
        let oldQuantity = currentStock.quantity;

        submittedEntry.isSubmitted = true;
        submittedEntry.old_quantity = oldQuantity;
        currentStock.quantity = oldQuantity + submittedEntry.quantity;

        await submittedEntry.save();
        await currentStock.save();
      }
      else {
        isError = true;
        console.log("nije");
      }
    });
    console.log("isErrorr");
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
