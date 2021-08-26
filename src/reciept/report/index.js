const Reciept = require("../schema");
const Location = require("../../location/schema");
const Product = require("../../product/schema");
const moment = require('moment')

const Joi = require("joi");

const serializer = Joi.object({
    start_date: Joi.string().length(10).required(),
    end_date: Joi.string().length(10).required(),
    city_id: Joi.string().allow(''),
    location_id: Joi.string().allow(''),
    warehouse_id: Joi.string().allow('')
});

async function report(req, res) {
    try {
        delete req.body.userId;
        const result = serializer.validate(req.body);
        if (result.error) {
            return res.status(400).json({ error: "Poslani su neispravni podatci!" });
        }
        if (req.body.city_id != "" && req.body.city_id.length != 24
        || req.body.location_id != "" && req.body.location_id.length != 24
        || req.body.warehouse_id != "" && req.body.warehouse_id.length != 24) {
            return res.status(400).json({ error: "Poslan je neispravan ID grada, ID lokacije ili ID skladišta!" });
        }

        let reciepts = await Reciept.find({
            isSubmitted: true,
            createdAt: {
                $gte: moment(req.body.start_date, 'YYYY/MM/DD').startOf('day').toDate(),
                $lte: moment(req.body.end_date, 'YYYY/MM/DD').endOf('day').toDate()
            }
        })
            .populate("warehouse_id", { name: 1, location_id: 1 })
            .populate("product_id", { name: 1 })
            .populate("user_id", { fname: 1, lname: 1 })
            .sort({ createdAt: 'desc' });

        let locations = await Location.find({}).populate("city_id", { name: 1 });
        let products = await Product.find({}).populate("category_id", { name: 1 }).populate("subcategory_id", { name: 1 }).populate("packaging_id", { name: 1 });

        
        if (req.body.warehouse_id.length == 24) {
            reciepts = reciepts.filter(reciept => reciept.warehouse_id.id == req.body.warehouse_id);
        }
        else{
            if (req.body.city_id.length == 24) {
                let filteredLocations = locations.filter(location => location.city_id.id == req.body.city_id);
                let locationIds = filteredLocations.map(item => item.id);
                reciepts = reciepts.filter(reciept => locationIds.indexOf(reciept.warehouse_id.location_id.toString()) != -1);
            }
            if (req.body.location_id.length == 24) {
                reciepts = reciepts.filter(reciept => reciept.warehouse_id.location_id == req.body.location_id);
            }
        }

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
                && reportReciept.date == moment(reciept.createdAt).format('DD.MM.YYYY.')
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
                    quantity: reciept.quantity,
                    date: moment(reciept.createdAt).format('DD.MM.YYYY.')
                })
            }
            else {
                let index = reportReciepts.indexOf(filteredReciepts[0]);
                reportReciepts[index].quantity = reportReciepts[index].quantity + reciept.quantity;
            }
        });
        if (reportReciepts.length > 0) {
            reportReciepts = reportReciepts.sort(compareCategory).sort(compareSubcategory).sort(comparePackaging).sort(compareProduct)
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

        return res.status(200).json({ reciepts: grouppedReportReciepts.sort(compareCity).sort(compareLocation).sort(compareWarehouse) });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
    }
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

function replaceUtf8(word) {
    return word
        .replace(/č|ć/g, "c").replace(/Č|Ć/g, "C")
        .replace("š", "s").replace("Š", "S")
        .replace("đ", "d").replace("Đ", "D")
        .replace("ž", "z").replace("Ž", "Z");
}


module.exports = report;
