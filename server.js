require("dotenv").config();

const endpoint = "https://api.sendwithus.com/api/v1";
var fs = require("fs"),
    smtp = require("smtp-protocol"),
    http = require("request"),
    MailParser = require("mailparser").MailParser,
    server;

// read TLS certificates from filesystem
["cert", "ca", "key"].forEach(function(prop) {
    if (process.env[prop]) {
        process.env[prop] = fs.readFileSync(process.env[prop]);
    }
});

// create mail proxy server
server = smtp.createServer(process.env, function(req) {

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
                    console.log(status, "message transmitted for", recipient);
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

// start server
server.listen(process.env.port || 25, function() {
    var address = server.address();

    // drop privileges
    if (process.env.user) {
        console.log("dropping privileges");
        process.setgid(process.env.group || process.env.user);
        process.setuid(process.env.user);
    }

    address = address.family === "IPv6"
        ? `[${address.address}]:${address.port}`
        : `${address.address}:${address.port}`;

    console.log("listening on", address);
});
