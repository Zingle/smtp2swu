const endpoint = "https://api.sendwithus.com/api/v1";
var smtp = require("smtp-protocol"),
    http = require("request"),
    MailParser = require("mailparser").MailParser;

/**
 * Create new SMTP gateway server.
 * @param {object} opts
 * @param {string} opts.swukey
 * @param {string} opts.swutemplate
 * @param {string} [opts.user]
 * @param {string} [opts.group]
 * @param {number} [opts.port]
 * @param {string} [opts.key]
 * @param {string} [opts.cert]
 * @param {string} [opts.ca]
 */
function createServer(opts) {
    return smtp.createServer(opts, function(req) {

        // accept all incoming messages
        req.on("to", function(to, ack) {
            ack.accept();
        });

        // send message to SWU endpoint
        req.on("message", function(stream, ack) {
            stream.pipe(new MailParser().on("end", function(email) {
                var recipient = email.to[0].address

                http.post({
                    url: endpoint + "/send",
                    auth: {
                        user: process.env.swukey,
                        pass: "",
                        sendImmediately: true
                    },
                    json: {
                        template: process.env.swutemplate,
                        sender: email.from[0],
                        recipient: email.to[0],
                        cc: [],
                        bcc: [],
                        template_data: {
                            subject: email.subject,
                            body: email.text
                        }
                    }
                }, function(err, res, body) {
                    var status;

                    if (err) return console.error(err);

                    status = String(res.statusCode);
                    if (res.statusCode >= 500) {
                        console.error(status, "failed to transmit message");
                    } else if (res.statusCode >= 200 && res.statusCode < 300) {
                        console.log(status, "message transmitted to", recipient);
                    } else {
                        console.error(status + " unexpected");
                    }
                });
            }).on("error", function(err) {
                console.error(err);
            }));

            ack.accept();
        });

    });
}

module.exports = createServer;
