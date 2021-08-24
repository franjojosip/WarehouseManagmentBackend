const Reciept = require("../schema");
const Stock = require("../../stock/schema");
const NotificationLog = require("../../notification_log/schema");
const NotificationType = require("../../notification_type/schema");
const NotificationSetting = require("../../notification_settings/schema");
var nodemailer = require('nodemailer');
const moment = require("moment");
var fs = require('fs');
const { default: jsPDF } = require("jspdf");
require('jspdf-autotable');
const Joi = require("joi");

const serializer = Joi.object({
    reciept_ids: Joi.array().required(),
    userId: Joi.string()
});

async function submitReciepts(req, res) {
    try {
        const result = serializer.validate(req.body);
        if (result.error) {
            return res.status(400).json({ error: "Poslani su neispravni podatci!" });
        }


        let isError = false;
        let missingReciepts = [];
        for (const id of result.value.reciept_ids) {
            const submittedReciept = await Reciept.findById(id);
            const currentStock = await Stock.findOne({ warehouse_id: submittedReciept.warehouse_id, product_id: submittedReciept.product_id })
                .populate("warehouse_id", { name: 1, location_id: 1 })
                .populate("product_id", { name: 1, packaging_id: 1 });

            if (submittedReciept && currentStock) {
                let oldQuantity = currentStock.quantity;

                submittedReciept.isSubmitted = true;
                submittedReciept.old_quantity = oldQuantity;
                currentStock.quantity = oldQuantity - submittedReciept.quantity;

                await submittedReciept.save();
                await currentStock.save();
                if (currentStock.quantity <= currentStock.minimum_quantity) {
                    missingReciepts.push(currentStock);
                }
            }
            else {
                isError = true;
            }
        };

        if (missingReciepts.length > 0) {
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

                let data = await getPDFData(missingReciepts);
                let path = generatePdf("Izvanredni izvještaj", "izvanredni_izvjestaj", data);
                sendEmail(title, email, path);

                let logData = getLogData(data);

                newNotificationLog.data = logData;
                await newNotificationLog.save();
            }
        }

        if (isError) {
            return res.status(404).json({ error: "Dio proizvoda se ne nalazi na odabranom skladištu, molimo provjerite preuzimanja!" });
        } else {
            return res.status(200).json({ status: "Uspješno potvrđeni sva sva preuzimanja!" });
        }
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

async function getPDFData(reciepts) {
    let reportReciepts = [];
    reciepts.forEach((reciept) => {
        let location = locations.find(location => location.id == reciept.warehouse_id.location_id);
        let product = products.find(product => product.id == reciept.product_id.id);
        if (!product.subcategory_id) {
            reciept.subcategory_id = { id: "", name: "" };
            product.subcategory_id = { id: "", name: "" };
        }

        let filteredReciepts = reportReciepts.filter(reportReciept =>
            reportReciept.warehouse_id == reciept.warehouse_id.id
            && reportReciept.product_id == reciept.product_id.id
        );
        if (filteredReciepts.length == 0) {
            reportReciepts.push({
                warehouse_id: reciept.warehouse_id.id,
                warehouse_name: replaceUtf8(reciept.warehouse_id.name),
                city_id: location.city_id.id,
                city_name: replaceUtf8(location.city_id.name),
                location_id: location.id,
                location_name: replaceUtf8(location.street),
                product_id: product.id,
                product_name: replaceUtf8(product.name),
                category_id: product.category_id.id,
                category_name: replaceUtf8(product.category_id.name),
                subcategory_id: product.subcategory_id != "" ? product.subcategory_id.id : "",
                subcategory_name: product.subcategory_id != "" ? replaceUtf8(product.subcategory_id.name) : "",
                packaging_id: product.packaging_id.id,
                packaging_name: replaceUtf8(product.packaging_id.name),
                quantity: reciept.quantity
            })
        }
        else {
            let index = reportReciepts.indexOf(filteredReciepts[0]);
            reportReciepts[index].quantity = reportReciepts[index].quantity + reciept.quantity;
        }
    });
    if (reportReciepts.length > 0) {
        reportReciepts = reportReciepts.sort(compareCategories).sort(deepCompareProducts)
    }
    let grouppedReportReciepts = [];

    reportReciepts.forEach(reciept => {
        let filteredReciepts = grouppedReportReciepts.filter(grouppedReciept => grouppedReciept.warehouse_id == reciept.warehouse_id);
        if (grouppedReportReciepts.length == 0 || filteredReciepts.length == 0) {
            grouppedReportReciepts.push({
                warehouse_id: reciept.warehouse_id,
                warehouse_name: reciept.warehouse_name,
                city_name: reciept.city_name,
                location_name: reciept.location_name,
                data: [reciept]
            })
        }
        else {
            let index = grouppedReportReciepts.indexOf(filteredReciepts[0]);
            grouppedReportReciepts[index].data.push(reciept);
        }
    });
    return grouppedReportReciepts.sort(compareCities).sort(deepCompareLocations);
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


function compareCategories(a, b) {
    if (a.category_name[0] < b.category_name[0]) {
        return -1;
    }
    if (a.category_name[0] > b.category_name[0]) {
        return 1;
    }
    return 0;
}

function deepCompareProducts(a, b) {
    if (a.category_name[0] == b.category_name[0] && a.product_name[0] < b.product_name[0]) {
        return -1;
    }
    if (a.category_name[0] == b.category_name[0] && a.product_name[0] > b.product_name[0]) {
        return 1;
    }
    return 0;
}

function compareCities(a, b) {
    if (a.city_name[0] < b.city_name[0]) {
        return -1;
    }
    if (a.city_name[0] > b.city_name[0]) {
        return 1;
    }
    return 0;
}

function deepCompareLocations(a, b) {
    if (a.city_name[0] == b.city_name[0] && a.location_name[0] < b.location_name[0]) {
        return -1;
    }
    if (a.city_name[0] == b.city_name[0] && a.location_name[0] > b.location_name[0]) {
        return 1;
    }
    return 0;
}

function replaceUtf8(word) {
    return word
        .replace(/č|ć/g, "c").replace(/Č|Ć/g, "C")
        .replace("š", "s").replace("Š", "S")
        .replace("đ", "d").replace("Đ", "D")
        .replace("ž", "z").replace("Ž", "Z");
}



module.exports = submitReciepts;