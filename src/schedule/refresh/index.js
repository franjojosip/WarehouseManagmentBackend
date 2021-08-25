const Joi = require("joi");
const NotificationSetting = require("../../notification_settings/schema");
const NotificationLog = require("../../notification_log/schema");
const Stock = require("../../stock/schema");
const Location = require("../../location/schema");
const Product = require("../../product/schema");
const PasswordRequest = require("../../users/passwordRequestSchema");
const cron = require('node-cron');
const moment = require("moment");
var nodemailer = require('nodemailer');
var fs = require('fs');
const { default: jsPDF } = require("jspdf");
require('jspdf-autotable');

const serializer = Joi.object({
  password: Joi.string().required()
});

async function refresh(req, res) {
  try {
    const result = serializer.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: "Poslani su neispravni podatci!" });
    }
    if (result.value.password != process.env.SUPER_ADMIN_PASSWORD) {
      return res.status(403).json({ error: "Nemate prava pristupa!" });
    }

    const notificationSettings = await NotificationSetting.find({}).populate("notification_type_id", { name: 1 });

    let cronTasks = cron.getTasks();
    if (cronTasks.length > 0) {
      cronTasks.forEach(task => {
        task.stop();
      });
    }

    cron.schedule("0 */12 * * *", async () => {
      var forgotPasswordEmails = await PasswordRequest.find({ isUsed: false });
      let tasks = [];
      forgotPasswordEmails.forEach(request => {
        if (moment().diff(moment(request.createdAt, "DD/MM/YYYY HH:mm"), 'hours') > 12) {
          tasks.push(PasswordRequest.findByIdAndUpdate(request._id, {
            isUsed: true,
          }));
        }
      })
      await Promise.all(tasks);
    }, {
      scheduled: true,
      timezone: "Europe/Zagreb"
    });

    await notificationSettings.forEach(async (setting) => {
      if (setting.notification_type_id.name == "Dnevna obavijest") {
        let time = moment(setting.time).format("HH:mm").toString();
        let timeArray = time.split(":");
        console.log("Postavljena dnevna obavijest: " + `${timeArray[1]} ${timeArray[0]} * * *`);

        await cron.schedule(`${timeArray[1]} ${timeArray[0]} * * *`, async () => {
          let date = moment().tz("Europe/Zagreb").format("DD/MM/YYYY HH:mm").toString();
          let email = setting.email;
          let title = `Dnevni izvještaj ${date}`;

          console.log(title);

          let data = await getPdfData();
          if (data.length > 0) {
            let path = generatePdf("Dnevni izvještaj", "dnevni_izvjestaj", data);
            sendEmail(title, email, path);
          }
          else {
            sendEmail(title, email, null);
          }
          let logData = getLogData(data);

          const newNotificationLog = new NotificationLog();
          newNotificationLog.notification_type_id = setting.notification_type_id.id;
          newNotificationLog.subject = "Dnevni izvještaj";
          newNotificationLog.email = email;
          newNotificationLog.data = logData;
          await newNotificationLog.save();
        }, {
          scheduled: true,
          timezone: "Europe/Zagreb"
        });
      }
      else if (setting.notification_type_id.name == "Tjedna obavijest") {
        let time = moment(setting.time).format("HH:mm").toString();
        let timeArray = time.split(":");
        let day_of_week = setting.day_of_week;

        console.log("Postavljena tjedna obavijest: " + `${timeArray[1]} ${timeArray[0]} * * ${day_of_week}`);

        await cron.schedule(`${timeArray[1]} ${timeArray[0]} * * ${day_of_week}`, async () => {
          let date = moment().tz("Europe/Zagreb").format("DD/MM/YYYY HH:mm").toString();
          let email = setting.email;
          let title = `Tjedni izvještaj ${date}`;
          console.log(title);

          let data = await getPdfData();
          if (data.length > 0) {
            let path = generatePdf("Tjedni izvještaj", "tjedni_izvjestaj", data);
            sendEmail(title, email, path);
          }
          else {
            sendEmail(title, email, null);
          }
          let logData = getLogData(data);

          const newNotificationLog = new NotificationLog();
          newNotificationLog.notification_type_id = setting.notification_type_id.id;
          newNotificationLog.subject = "Tjedni izvještaj";
          newNotificationLog.email = email;
          newNotificationLog.data = logData;
          await newNotificationLog.save();
        });
      }
      else if (setting.notification_type_id.name == "Mjesečna obavijest") {
        let time = moment(setting.time).format("HH:mm").toString();
        let timeArray = time.split(":");
        console.log("Postavljena mjesečna obavijest: " + `${timeArray[1]} ${timeArray[0]} 1 1-12 *`);

        await cron.schedule(`${timeArray[1]} ${timeArray[0]} 1 1-12 *`, async () => {
          let date = moment().tz("Europe/Zagreb").format("DD/MM/YYYY HH:mm").toString();
          let email = setting.email;
          let title = `Mjesečni izvještaj ${date}`;
          console.log(title);

          let data = await getPdfData();
          if (data.length > 0) {
            let path = generatePdf("Mjesečni izvještaj", "mjesecni_izvjestaj", data);
            sendEmail(title, email, path);
          }
          else {
            sendEmail(title, email, null);
          }
          let logData = getLogData(data);

          const newNotificationLog = new NotificationLog();
          newNotificationLog.notification_type_id = setting.notification_type_id.id;
          newNotificationLog.subject = "Mjesečni izvještaj";
          newNotificationLog.email = email;
          newNotificationLog.data = logData;
          await newNotificationLog.save();
        });
      }
    });

    return res.status(200).json({ status: "Uspješno osvježene automatske obavijesti!" });
  } catch (err) {
    return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
  }
}

function getLogData(data) {
  if (data.length > 0) {
    let text = `U skladištima nedostaju proizvodi:\n\n`;

    data.forEach(warehouse => {
      text += `SKLADIŠTE: ${warehouse.warehouse_name}, ${warehouse.location_name}, ${warehouse.city_name}\n`;

      warehouse.data.forEach(item => {
        text += `PROIZVOD: ${item.product_name}\nKATEGORIJA: ${item.category_name}\nPOTKATEGORIJA: ${item.subcategory_name}\nAMBALAŽA: ${item.packaging_name}\nKOLIČINA: ${item.quantity}\nMIN KOLIČINA: ${item.minimum_quantity}\n\n`;
      });

      text += `\n\n`;
    });
    return text;

  }
  else {
    return "Skladišta sadrže potrebnu količinu proizvoda."
  }
}

function sendEmail(title, email, path) {
  const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
      user: process.env.LOGGER_EMAIL,
      pass: process.env.LOGGER_PASSWORD
    },
    secure: true,
  });

  let html = "";
  if (path) {
    html = '<!DOCTYPE html>' +
      `<html><head><title>${title} o stanju proizvoda na skladištima</title>` +
      '</head><body>' +
      '<h3>U Vašim skladištima nedostaju proizvodi!</h3>' +
      '<p>Za više informacija provjerite dobiveni pdf iz priloga.</p>' +
      '</body></html>';

    let nameArray = path.split("/");

    var mailOptions = {
      from: "upravljanjeskladistem@gmail.com",
      to: email,
      subject: title,
      html: html,
      attachments: [{
        filename: nameArray[nameArray.length - 1],
        path: path,
        contentType: 'application/pdf'
      }],
    };
  }
  else {
    html = '<!DOCTYPE html>' +
      `<html><head><title>${title} o stanju proizvoda na skladištima</title>` +
      '</head><body>' +
      '<h3>Skladišta sadrže potrebnu količinu proizvoda!</h3>' +
      '</body></html>';

    var mailOptions = {
      from: "upravljanjeskladistem@gmail.com",
      to: email,
      subject: title,
      html: html
    };
  }
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    }
    if(path){
      fs.unlink(path, function (err) {
        if (err) console.log(err);
      });
    }
  });
}

function generatePdf(title, docTitle, data) {
  let tableRows = [];
  let head = [];
  let y = 85;

  const doc = new jsPDF('p', 'mm');
  let pageHeight = doc.internal.pageSize.height;

  //Logo slika
  var path_url = './images/warehouse_logo_pdf2.png', format = 'PNG';
  var imgData = fs.readFileSync(path_url).toString('base64');
  doc.addImage(imgData, format, 15, 15, 41, 35);

  //PDF naslov
  doc.setFontSize(22);
  let width = 145;
  if (title == "Dnevni izvještaj") {
    width = 140;
  }
  else if (title == "Tjedni izvještaj") {
    width = 142;
  }
  else {
    width = 138;
  }
  doc.text(replaceUtf8(title), width, 22);

  //Naziv stranice
  doc.setFontSize(15);
  doc.text("Upravljanje skladištima", 140, 32);
  doc.setFontSize(13);
  doc.line(130, 36, 200, 36);

  //Url
  doc.text("upravljanjeskladistima.vercel.app", 136, 42);

  //Prijelom linija
  doc.setLineWidth(1.1);
  doc.setDrawColor(181, 181, 181);
  doc.line(0, 65, 220, 65);

  //Postavi font za tablicu
  doc.setFontSize(16);
  doc.setDrawColor(0, 0, 0);
  data.forEach((warehouse, i) => {
    head = [
      [
        { content: 'Naziv skladista: ' + replaceUtf8(warehouse.warehouse_name), colSpan: 2, styles: { halign: 'center', fillColor: [20, 151, 124] } },
        { content: 'Lokacija: ' + replaceUtf8(warehouse.location_name), colSpan: 2, styles: { halign: 'center', fillColor: [20, 151, 124] } },
        { content: 'Grad: ' + replaceUtf8(warehouse.city_name), colSpan: 2, styles: { halign: 'center', fillColor: [20, 151, 124] } }
      ],
      [
        { content: 'Proizvod', colSpan: 1, styles: { halign: 'center' } },
        { content: 'Kategorija', colSpan: 1, styles: { halign: 'center' } },
        { content: 'Potkategorija', colSpan: 1, styles: { halign: 'center' } },
        { content: 'Ambalaza', colSpan: 1, styles: { halign: 'center' } },
        { content: 'Trenutna Kolicina', colSpan: 1, styles: { halign: 'center' } },
        { content: 'Min. Kolicina', colSpan: 1, styles: { halign: 'center' } }
      ],
    ];
    tableRows = [];
    warehouse.data.forEach(item => {
      const itemData = [
        replaceUtf8(item.product_name),
        replaceUtf8(item.category_name),
        replaceUtf8(item.subcategory_name),
        replaceUtf8(item.packaging_name),
        item.quantity,
        item.minimum_quantity,
      ];
      tableRows.push(itemData);
    });
    if (i != 0 && doc.lastAutoTable.finalY && y >= pageHeight) {
      doc.addPage();
      y = 0
    }
    else if (i != 0) {
      y = doc.lastAutoTable.finalY + 15
    }
    let number = 2;
    doc.autoTable({
      startY: y,
      head: head,
      body: tableRows,
      theme: 'grid',
      tableWidth: 'auto',
      styles: {
        cellPadding: { top: number, right: number, bottom: number, left: number },
      },
      bodyStyles: { halign: 'center', valign: 'middle' },
      headStyles: { halign: 'center', valign: 'middle' }
    });
  });

  let date = moment().tz("Europe/Zagreb").format("DD_MM_YYYY_HH_mm").toString();

  let path = `src/schedule/pdf/${date}_${docTitle}.pdf`;

  doc.save(path);
  return path;
};


async function getPdfData() {
  let stocks = await Stock.find({})
    .populate("warehouse_id", { name: 1, location_id: 1 })
    .populate("product_id", { name: 1 })

  let locations = await Location.find({}).populate("city_id", { name: 1 });
  let products = await Product.find({}).populate("category_id", { name: 1 }).populate("subcategory_id", { name: 1 }).populate("packaging_id", { name: 1 });

  let reportStocks = [];
  stocks.forEach((stock) => {
    let location = locations.find(location => location.id == stock.warehouse_id.location_id);
    let product = products.find(product => product.id == stock.product_id.id);

    let filteredReciepts = reportStocks.filter(reportReciept =>
      reportReciept.warehouse_id == stock.warehouse_id.id
      && reportReciept.product_id == stock.product_id.id
    );
    if (stock.quantity <= stock.minimum_quantity) {
      if (filteredReciepts.length == 0) {
        reportStocks.push({
          warehouse_id: stock.warehouse_id.id,
          warehouse_name: replaceUtf8(stock.warehouse_id.name),
          city_id: location.city_id.id,
          city_name: replaceUtf8(location.city_id.name),
          location_id: location.id,
          location_name: replaceUtf8(location.street),
          product_id: product.id,
          product_name: replaceUtf8(product.name),
          category_id: product.category_id.id,
          category_name: replaceUtf8(product.category_id.name),
          subcategory_id: product.subcategory_id != null ? product.subcategory_id.id : "",
          subcategory_name: product.subcategory_id != null ? replaceUtf8(product.subcategory_id.name) : "",
          packaging_id: product.packaging_id.id,
          packaging_name: replaceUtf8(product.packaging_id.name),
          quantity: stock.quantity,
          minimum_quantity: stock.minimum_quantity
        })
      }
      else {
        let index = reportStocks.indexOf(filteredReciepts[0]);
        reportStocks[index].quantity = reportStocks[index].quantity + stock.quantity;
      }
    }
  });
  if (reportStocks.length > 0) {
    reportStocks = reportStocks.sort(compareCategory).sort(compareSubcategory).sort(comparePackaging).sort(compareProduct)
  }
  else {
    return [];
  }
  let grouppedReportReciepts = [];

  reportStocks.forEach(stock => {
    let filteredReciepts = grouppedReportReciepts.filter(grouppedReciept => grouppedReciept.warehouse_id == stock.warehouse_id);
    if (grouppedReportReciepts.length == 0 || filteredReciepts.length == 0) {
      grouppedReportReciepts.push({
        warehouse_id: stock.warehouse_id,
        warehouse_name: stock.warehouse_name,
        city_name: stock.city_name,
        location_name: stock.location_name,
        data: [stock]
      })
    }
    else {
      let index = grouppedReportReciepts.indexOf(filteredReciepts[0]);
      grouppedReportReciepts[index].data.push(stock);
    }
  });
  return grouppedReportReciepts.sort(compareCity).sort(compareLocation).sort(compareWarehouse);
}

function replaceUtf8(word) {
  return word
    .replace(/č|ć/g, "c").replace(/Č|Ć/g, "C")
    .replace("š", "s").replace("Š", "S")
    .replace("đ", "d").replace("Đ", "D")
    .replace("ž", "z").replace("Ž", "Z");
}

function compareCategory(a, b) {
  if (a.category_name < b.category_name) {
    return -1;
  }
  if (a.category_name > b.category_name) {
    return 1;
  }
  return 0;
}
function compareSubcategory(a, b) {
  if (a.category_name == b.category_name && a.subcategory_name < b.subcategory_name) {
    return -1;
  }
  if (a.category_name == b.category_name && a.subcategory_name > b.subcategory_name) {
    return 1;
  }
  return 0;
}

function comparePackaging(a, b) {
  if (a.category_name == b.category_name && a.subcategory_name == b.subcategory_name && a.packaging_name < b.packaging_name) {
    return -1;
  }
  if (a.category_name == b.category_name && a.subcategory_name == b.subcategory_name && a.packaging_name > b.packaging_name) {
    return 1;
  }
  return 0;
}

function compareProduct(a, b) {
  if (a.category_name == b.category_name && a.subcategory_name == b.subcategory_name && a.packaging_name == b.packaging_name && a.product_name < b.product_name) {
    return -1;
  }
  if (a.category_name == b.category_name && a.subcategory_name == b.subcategory_name && a.packaging_name == b.packaging_name && a.product_name > b.product_name) {
    return 1;
  }
  return 0;
}

function compareCity(a, b) {
  if (a.city_name < b.city_name) {
    return -1;
  }
  if (a.city_name > b.city_name) {
    return 1;
  }
  return 0;
}

function compareLocation(a, b) {
  if (a.city_name == b.city_name && a.location_name < b.location_name) {
    return -1;
  }
  if (a.city_name == b.city_name && a.location_name > b.location_name) {
    return 1;
  }
  return 0;
}

function compareWarehouse(a, b) {
  if (a.city_name == b.city_name && a.location_name == b.location_name && a.warehouse_name > b.warehouse_name) {
      return -1;
  }
  if (a.city_name == b.city_name && a.location_name == b.location_name && a.warehouse_name > b.warehouse_name) {
      return 1;
  }
  return 0;
}

module.exports = refresh;
