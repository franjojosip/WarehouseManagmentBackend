const Entry = require("../schema");
const Stock = require("../../stock/schema");
const Joi = require("joi");

const serializer = Joi.object({
  entry_ids: Joi.array().required(),
  userId: Joi.string()
});
function forEachAsync(array, fun, cb) {
  var index = 0;
  if (index == array.length) {
    cb(null);
    return;
  }

  var next = function () {
    fun(array[index], function (err) {
      if (err) {
        cb(err);
        return;
      }
      index++;
      if (index < array.length) {
        setImmediate(next);
        return;
      }

      //We are done
      cb(null);
    });
  };

  next();
}
async function submitEntries(req, res) {
  console.log(req.body);
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }
    let isError = false;
    const asyncUppercase = item =>
      new Promise(resolve =>
        setTimeout(
          () => resolve(item.toUpperCase()),
          Math.floor(Math.random() * 1000)
        )
      );

    const uppercaseItems = async () => {
      const items = ['a', 'b', 'c'];
      await items.forEach(async item => {
        const uppercaseItem = await asyncUppercase(item);
        console.log(uppercaseItem);
      });

      console.log('Items processed');
    };

    uppercaseItems();


    forEachAsync(result.value.entry_ids, function (e, cb) {
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
        console.log("not");
        isError = true;
      }
      cb();
    }, function (err) {
      console.log("iserror");
      if (isError) {
        return res.status(404).json({ error: "Dio proizvoda se ne nalazi na odabranom skladištu, molimo provjerite unose!" });
      } else {
        return res.status(200).json({ status: "Uspješno potvrđeni svi unosi!" });
      }
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = submitEntries;
