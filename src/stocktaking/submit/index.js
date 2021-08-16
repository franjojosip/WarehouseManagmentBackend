const Stocktaking = require("../schema");

async function submit(req, res) {
  try {
    const submittedStocktaking = await Stocktaking.findById(req.params.id);

    if (submittedStocktaking) {
      submittedStocktaking.isSubmitted = true;
      await submittedStocktaking.save();
      return res.status(200).json({ status: "Uspješno potvrđena inventura!" });
    } else {
      return res.status(404).json({ error: "Proizvod se ne nalazi u odabranom skladištu!" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

module.exports = submit;
