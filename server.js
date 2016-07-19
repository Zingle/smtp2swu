require("dotenv").config();

var fs = require("fs"),
    smtp2swu = require("./"),
    server;

// read TLS certificates from filesystem
["cert", "ca", "key"].forEach(function(prop) {
    if (process.env[prop]) {
        process.env[prop] = fs.readFileSync(process.env[prop]);
    }
});

// create SMTP gateway server
server = smtp2swu(process.env);

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
