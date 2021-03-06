const Stocktaking = require("../schema");
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


        let stocktakings = await Stocktaking.find({
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
            stocktakings = stocktakings.filter(stocktaking => stocktaking.warehouse_id.id == req.body.warehouse_id);
        }
        else {
            if (req.body.city_id.length == 24) {
                let filteredLocations = locations.filter(location => location.city_id.id == req.body.city_id);
                let locationIds = filteredLocations.map(item => item.id);
                stocktakings = stocktakings.filter(stocktaking => locationIds.indexOf(stocktaking.warehouse_id.location_id.toString()) != -1);
            }
            if (req.body.location_id.length == 24) {
                stocktakings = stocktakings.filter(stocktaking => stocktaking.warehouse_id.location_id == req.body.location_id);
            }
        }

        let reportStocktakings = [];
        stocktakings.forEach((stocktaking) => {
            let location = locations.find(location => location.id == stocktaking.warehouse_id.location_id);
            let product = products.find(product => product.id == stocktaking.product_id.id);
            if (!product.subcategory_id) {
                stocktaking.subcategory_id = { id: "", name: "" };
                product.subcategory_id = { id: "", name: "" };
            }

            let filteredStocktakings = reportStocktakings.filter(reportStocktaking =>
                reportStocktaking.warehouse_id == stocktaking.warehouse_id.id
                && reportStocktaking.product_id == stocktaking.product_id.id
                && reportStocktaking.date == moment(stocktaking.createdAt).format('DD.MM.YYYY.')
            );
            if (filteredStocktakings.length == 0) {
                reportStocktakings.push({
                    warehouse_id: stocktaking.warehouse_id.id,
                    warehouse_name: replaceUtf8(stocktaking.warehouse_id.name),
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
                    real_quantity: stocktaking.real_quantity,
                    counted_quantity: stocktaking.counted_quantity,
                    date: moment(stocktaking.createdAt).format('DD.MM.YYYY.')
                })
            }
        });
        if (reportStocktakings.length > 0) {
            reportStocktakings = reportStocktakings.sort(compareDate).sort(compareCategory).sort(compareSubcategory).sort(comparePackaging).sort(compareProduct)
        }
        let grouppedReportStocktakings = [];

        reportStocktakings.forEach(stocktaking => {
            let filteredStocktakings = grouppedReportStocktakings.filter(grouppedStocktaking => grouppedStocktaking.warehouse_id == stocktaking.warehouse_id);
            if (grouppedReportStocktakings.length == 0 || filteredStocktakings.length == 0) {
                grouppedReportStocktakings.push({
                    warehouse_id: stocktaking.warehouse_id,
                    warehouse_name: stocktaking.warehouse_name,
                    city_name: stocktaking.city_name,
                    location_name: stocktaking.location_name,
                    data: [stocktaking]
                })
            }
            else {
                let index = grouppedReportStocktakings.indexOf(filteredStocktakings[0]);
                grouppedReportStocktakings[index].data.push(stocktaking);
            }
        });

        return res.status(200).json({ stocktakings: grouppedReportStocktakings.sort(compareCity).sort(compareLocation).sort(compareWarehouse) });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
    }
}
function compareDate(a, b) {
    if ((moment(a.date).diff(moment(b.date), 'days') > 0)) {
        return -1;
    }
    if ((moment(a.date).diff(moment(b.date), 'days') < 0)) {
        return 1;
    }
    return 0;
}

function compareCategory(a, b) {
    if (a.date == b.date && a.category_name < b.category_name) {
        return -1;
    }
    if (a.date == b.date && a.category_name > b.category_name) {
        return 1;
    }
    return 0;
}

function compareSubcategory(a, b) {
    if (a.date == b.date && a.category_name == b.category_name && a.subcategory_name < b.subcategory_name) {
        return -1;
    }
    if (a.date == b.date && a.category_name == b.category_name && a.subcategory_name > b.subcategory_name) {
        return 1;
    }
    return 0;
}

function comparePackaging(a, b) {
    if (a.date == b.date && a.category_name == b.category_name && a.subcategory_name == b.subcategory_name && a.packaging_name < b.packaging_name) {
        return -1;
    }
    if (a.date == b.date && a.category_name == b.category_name && a.subcategory_name == b.subcategory_name && a.packaging_name > b.packaging_name) {
        return 1;
    }
    return 0;
}

function compareProduct(a, b) {
    if (a.date == b.date && a.category_name == b.category_name && a.subcategory_name == b.subcategory_name && a.packaging_name == b.packaging_name && a.product_name < b.product_name) {
        return -1;
    }
    if (a.date == b.date && a.category_name == b.category_name && a.subcategory_name == b.subcategory_name && a.packaging_name == b.packaging_name && a.product_name > b.product_name) {
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
