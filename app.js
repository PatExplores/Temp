const https = require('https');
const fs = require('fs');
var express = require('express'),
    path = require('path'),
    app = express();
var public = path.join(__dirname, 'public');

const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

app.get('/', function(req, res) {
    res.sendFile(path.join(public, 'index.htm'));
});

app.use('/', express.static(public));

var httpsServer = https.createServer(options, app);
httpsServer.listen(8000);