const http = require('http');
const fs = require('fs');
const cors = require('cors')

var express = require('express'),
    path = require('path'),
    app = express();
var public = path.join(__dirname, 'public');

//app.use(cors({origin:"*"}))

app.get('/', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.sendFile(path.join(public, 'index.htm'));
});

app.use('/', express.static(public));

var httpServer = http.createServer(app);
const port = process.env.PORT || 8000;
httpServer.listen(port);