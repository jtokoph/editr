#!/usr/bin/env node
var http = require('http'),
    child_process = require('child_process'),
    fs = require('fs'),
    fsExists = fs.exists || require('path').exists,

    argv = require('optimist')
    .usage('Run a server for remote file editing.\nUsage: $0 [--editor \'EDITOR\'] [--ip INTERFACE] [--port PORT] [-b]')
    .alias('e', 'editor')
    .describe('e', 'Local editor to spawn (don\'t forget -w)')
    .default('e', process.env['REDIT_EDITOR'] || process.env['EDITOR'] || 'subl -w')
    .describe('ip', 'Interface to listen on')
    .default('ip', process.env['REDIT_IP'] || '127.0.0.1')
    .describe('port', 'Port for server to listen on')
    .default('port', process.env['REDIT_PORT'] || 32123)
    .boolean('b')
    .alias('b', 'background')
    .describe('b', 'Run server as a daemon (background)')
    .boolean('h')
    .alias('h', 'help')
    .describe('h', 'Show this help message')
    .argv
;

if (argv.h) {
    require('optimist').showHelp();
    process.exit();
}

if (argv.background) {

    // TODO: fork and wait for success message before exiting
    var child = child_process.spawn(argv['$0'], ['--editor', '"' + argv.editor + '"','--ip', argv.ip, '--port', argv.port], {
        detached: true,
        stdio: [ 'ignore', 'ignore', 'ignore' ]
    });

    console.log('Spawned server with pid: ' + child.pid);

    child.unref();
} else {
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
                var tmpfile = '/tmp/'
                            + Date.now()
                            + '_'
                            + req.headers['x-hostname'].replace(/\//g, '_')
                            + req.url.replace(/\//g, '_');

                // if the file existed before, create it locally
                if (req.headers['x-exists'] == 'yes') {
                    // this could be async, but I doubt people will be launching many editors at once
                    fs.writeFileSync(tmpfile, buffer, 'utf8');
                }

                // launch the editor
                var e = child_process.exec(argv.editor + ' ' + tmpfile);
                e.on('exit', function(){
                    fsExists(tmpfile, function(exists) {
                        if (exists) {
                            // if the user actually saved a new file, or file already existed
                            // then send back the current state of the file
                            fs.readFile(tmpfile, 'utf8', function(err, str) {
                                res.writeHead(200, {'Content-Type': 'text/plain'})
                                res.end(str);
                                fs.unlink(tmpfile);
                            });
                        } else {
                            // otherwise just 404 because nothing happened
                            res.writeHead(404, {'Content-Type': 'text/plain'})
                            res.end();
                        }
                    });
                });
            };

        // use utf8 for all requests (text editors are useless for binary files anyway)
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
    server.listen(argv.port, argv.ip);
}

