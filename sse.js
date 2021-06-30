const http = require('http');
const uuid = require('uuid/v1');
const redis = require('redis').createClient();
const port = 3000;
const conn = {};
const log = require('winston');
require('winston-logrotate');
require('dotenv').config();

log.configure({
    transports: [
        new (log.transports.Rotate)({
            file: '/var/log/sse.log',
            size: '50m',
            keep: 5,
            json: false,
            timestamp: function() { return (new Date()).toLocaleString() },
        })
    ],
    level: process.env.LOG_LEVEL || 'info'
});

let server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });

    res.uuid = uuid();
    conn[res.uuid] = res;

    log.info('connected ' + res.uuid);

    let itr = setInterval(() => {
        res.write('event: ping\n');
        res.write('data: ' + new Date() + '\n\n');
    }, 30000);

    res.on('close', () => {
        log.info('disconnected ' + res.uuid);
        clearInterval(itr);
        delete conn[res.uuid];
    });
});

server.listen(port, () => {
    log.info('listening on ' + port);
    log.info(process.env.LOG_LEVEL);
    getMsg();
});

function getMsg(err, data) {
    if (!err && data) {
        let msg = data[1].split('#');
        log.debug(msg[0] + ': ' + msg[1]);

        Object.keys(conn).forEach(id => {
            conn[id].write('event: ' + msg[0] + '\n');
            conn[id].write('data: ' + msg[1] + '\n\n');
        });
    }
    redis.brpop('event-msg', 0, getMsg);
}
