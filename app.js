const https = require('https');
const fs = require('fs');
var cors = require('cors')

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
app.use(cors())

var httpsServer = https.createServer(options, app);
const port = process.env.PORT || 8000;
httpsServer.listen(port);