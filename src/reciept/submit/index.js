const Reciept = require("../schema");
const Stock = require("../../stock/schema");
const Location = require("../../location/schema");
const Product = require("../../product/schema");
const NotificationLog = require("../../notification_log/schema");
const NotificationType = require("../../notification_type/schema");
const NotificationSetting = require("../../notification_settings/schema");
var nodemailer = require('nodemailer');

async function submit(req, res) {
  try {
    const submittedReciept = await Reciept.findById(req.params.id);
    const currentStock = await Stock.findOne({ warehouse_id: submittedReciept.warehouse_id, product_id: submittedReciept.product_id })
      .populate("warehouse_id", { name: 1, location_id: 1 })
      .populate("product_id", { name: 1, packaging_id: 1 });

    if (!currentStock) {
      return res.status(404).json({ error: "Proizvod ne postoji u ovome skladištu, molimo provjerite podatke!" });
    }

    if (submittedReciept && currentStock) {
      let oldQuantity = currentStock.quantity;
      if (currentStock.quantity < submittedReciept.quantity) {
        return res.status(404).json({ error: "Skladište ne sadrži željenu količinu proizvoda za preuzeti: " + submittedReciept.quantity + ".\nPreostala količina je: " + oldQuantity });
      }

      submittedReciept.isSubmitted = true;
      currentStock.quantity = oldQuantity - submittedReciept.quantity;

      if (currentStock.quantity <= currentStock.minimum_quantity) {
        let locations = await Location.find({}).populate("city_id", { name: 1 });
        let products = await Product.find({}).populate("category_id", { name: 1 }).populate("subcategory_id", { name: 1 }).populate("packaging_id", { name: 1 });

        let location = locations.find(location => location.id == currentStock.warehouse_id.location_id);
        let product = products.find(product => product.id == currentStock.product_id.id);


        const notificationType = await NotificationType.findOne({ name: "Izvanredna obavijest" });

        //PRONAĐI U POSTAVKAMA KORISNIKA ZA SLANJE IZVANREDNE OBAVIJESTI
        const notificationSetting = await NotificationSetting.findOne({ notification_type_id: notificationType._id });

        //AKO POSTOJI KORISNIK KOJEM SE TREBA POSLATI
        if (notificationSetting && notificationType) {
          const logs = await NotificationLog.find({ notification_type_id: notificationType._id });

          //SPREMI OBAVIJEST U BAZU
          const newNotificationLog = new NotificationLog();
          newNotificationLog.notification_type_id = notificationType._id;
          newNotificationLog.subject = "Manjak proizvoda na skladištu #" + logs.length;
          newNotificationLog.email = notificationSetting.email;

          let warehouseName = `SKLADIŠTE: ${currentStock.warehouse_id.name}`;
          let cityName = `GRAD: ${location.city_id.name}`;
          let locationName = `ULICA: ${location.street}`;

          let productName = `PROIZVOD: ${product.name}`;
          let categoryName = `KATEGORIJA: ${product.category_id.name}`;
          let subcategoryName = `POTKATEGORIJA: ${product.subcategory_id ? product.subcategory_id.name : ""}`;
          let packagingName = `AMBALAŽA: ${product.packaging_id.name}`;
          let quantityName = `STANJE: ${currentStock.quantity}`;
          let minimumQuantityName = `MIN. STANJE: ${currentStock.minimum_quantity}`;

          let item = `Proizvod fali na stanju:\n\n${warehouseName}\n${cityName}\n${locationName}\n\n${productName}\n${categoryName}\n${subcategoryName}\n${packagingName}\n\n${quantityName}\n${minimumQuantityName}\n`;
          newNotificationLog.data = item;
          await newNotificationLog.save();
          
          let data = {
            warehouse: currentStock.warehouse_id.name,
            city: location.city_id.name,
            location: location.street,
            product: product.name,
            category: product.category_id.name,
            subcategory: product.subcategory_id ? product.subcategory_id.name : "",
            packaging: product.packaging_id.name,
            quantity: currentStock.quantity,
            minimum_quantity: currentStock.minimum_quantity
          };
          sendMissingItemEmail(newNotificationLog.subject, data, notificationSetting.email);
        }
      }

      await submittedReciept.save();
      await currentStock.save();

      return res.status(200).json({ status: "Uspješno potvrđen unos!" });
    } else {
      return res.status(404).json({ error: "Unos neispravan provjerite stanje!" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

function sendMissingItemEmail(title, data, email) {
  const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
      user: process.env.LOGGER_EMAIL,
      pass: process.env.LOGGER_PASSWORD
    },
    secure: true,
  });
  var mailOptions = {
    from: "upravljanjeskladistem@gmail.com",
    to: email,
    subject: title,
    html: '<!DOCTYPE html>' +
      '<html><head><title>Izvanredna obavijest</title>' +
      '</head><body>'
      +
      '<h2>Manjak proizvoda na stanju u skladištu!</h2>' +
      '<p style="margin-left:35px;margin-top:20px;">SKLADIŠTE: <b>' + data.warehouse + '</b></p>' +
      '<p style="margin-left:35px;">GRAD: <b>' + data.city + '</b></p>' +
      '<p style="margin-left:35px;">LOKACIJA: <b>' + data.location + '</b></p>' +
      '<p style="margin-left:35px;">PROIZVOD: <b>' + data.product + '</b></p>' +
      '<p style="margin-left:35px;">KATEGORIJA: <b>' + data.category + '</b></p>' +
      '<p style="margin-left:35px;">POTKATEGORIJA: <b>' + data.subcategory + '</b></p>' +
      '<p style="margin-left:35px;">AMBLAŽA: <b>' + data.packaging + '</b></p>' +
      '<p style="margin-left:35px;">TRENUTNO STANJE: <b>' + data.quantity + '</b></p>' +
      '<p style="margin-left:35px;">MINIMALNO STANJE: <b>' + data.minimum_quantity + '</b></p>' +
      '</body></html>'
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    }
  });
}


module.exports = submit;