const User = require("../schema");
const Joi = require("joi");
const PasswordRequest = require("../passwordRequestSchema");
const NotificationType = require("../../notification_type/schema");
const NotificationLog = require("../../notification_log/schema");
var nodemailer = require('nodemailer');
const moment = require("moment");

const serializer = Joi.object({
    email: Joi.string().required(),
});

async function requestResetPassword(req, res) {
    try {
        const result = serializer.validate(req.body);
        if (result.error) {
            return res.status(400).json({ error: "Poslani su neispravni podatci!" });
        }

        const user = await User.findOne({ email: result.value.email });
        if (!user) {
            return res.status(404).json({ error: "Korisnik s predanim email-om nije pronađen!" });
        }

        const paswordRequest = await PasswordRequest.find({ isUsed: false, user_id: user._id });

        if (paswordRequest.length > 1) {
            return res.status(400).json({ error: "Zahtjev za resetiranjem email-a je već poslan 2 puta!" });
        }

        const newPasswordRequest = new PasswordRequest();
        newPasswordRequest.user_id = user._id;
        await newPasswordRequest.save();

        const numOfRequests = await PasswordRequest.find({});
        const notificationType = await NotificationType.findOne({ name: "Zaboravljena lozinka" });

        let subject = "Zahtjev za resetiranje lozinke #" + numOfRequests.length.toString();

        const newNotificationLog = new NotificationLog();
        newNotificationLog.notification_type_id = notificationType._id;
        newNotificationLog.subject = subject;
        newNotificationLog.email = user.email;
        newNotificationLog.data = "Zahtjev vrijedi do: " + moment().add(12, 'hours').format('DD/MM/YYYY hh:mm');
        await newNotificationLog.save();
        
        const url = process.env.BACKEND_URL;
        let link = url + "?id=" + newPasswordRequest._id;
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
            to: user.email,
            subject: subject,
            html: '<!DOCTYPE html>' +
                '<html><head><title>' + user.fname + " " + user.lname + '</title>' +
                '</head><body><div>' +
                '<h2>Zatraženi su podatci za resetiranje lozinke.</h2>' +
                '<p>Trajanje linka je ograničeno na 12 od vremena primitka.</p>' +
                '<p>Kliknite na sljedeći <a href="' + link + '">link</a> za postavljanje nove lozinke.</p>' +
                '</div></body></html>'
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(400).json({
                    status: "Neuspješno poslan email!"
                });
            } else {
                return res.status(200).json({
                    status: "Uspješno poslan zahtjev za resetiranje lozinke!"
                });
            }
        });
    } catch (err) {
        return res.status(500).json({ error: "Dogodila se pogreška, molimo kontaktirajte administratora!" });
    }
}

module.exports = requestResetPassword;
