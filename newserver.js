var http = require('http'),
    child_process = require('child_process'),
    fs = require('fs'),
    fsExists = fs.exists || require('path').exists;

var server = http.createServer(function(req, res){
    var buffer = '',
        onData = function(data) {
            buffer = buffer + data;
            if (buffer.length == req.headers['content-length']) {
                editFile();
            }
        },
        editFile = function() {
            // create temporary path
            var tmpfile = '/tmp/' + Date.now() + '_' + req.headers['x-hostname'] + req.url.replace(/\//g, '_');

            // if the file existed before, create it locally
            if (req.headers['x-exists'] == 'yes') {
                // this could be async, but I doubt people will be launching many editors at once
                fs.writeFileSync(tmpfile, buffer, 'utf8');
            }

            // launch the editor
            var e = child_process.exec((process.env.REDITOR || 'mate -w') + ' ' + tmpfile);
            e.on('exit', function(){
                fsExists(tmpfile, function(exists) {
                    if (exists) {
                        // if the user actually saved a new file, or file already existed
                        // then send back the current state of the file
                        fs.readFile(tmpfile, 'utf8', function(err, str) {
                            if (str == buffer) {
                                // just 404 because nothing happened
                                res.writeHead(404, {'Content-Type': 'text/plain'})
                                res.end();
                            } else {
                                res.writeHead(200, {'Content-Type': 'text/plain'});
                                res.end(str);
                                fs.unlink(tmpfile);
                            }
                        });
                    } else {
                        // otherwise just 404 because nothing happened
                        res.writeHead(404, {'Content-Type': 'text/plain'})
                        res.end();
                    }
                });
            });
        };

    // use utf8 for all requests
    req.setEncoding('utf8');

    if (req.method == 'POST') {
        // if a post, its an attempt to edit
        onData('');
        req.on('data', onData);
    } else if (req.method == 'GET') {
        // get requests should return the client script
        fs.readFile('client.sh', 'utf8', function(err, str) {
            res.writeHead(200, {'Content-Type': 'text/plain'})
            res.end(str);
        });
    }
    
});
server.listen(process.env.REDIT_PORT || 32123);