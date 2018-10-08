var winston = require('winston');
var ENV = process.env.NODE_ENV; // получаю окружение


function getLogger(module) {

    var path = module.filename.split('\\').slice(-2).join('\\');

    return winston.createLogger({
        transport: [
            new winston.transports.Console({
                colorize: true,
                level: (~ENV.indexOf('development')) ? 'info' : 'error',
                label: path

            })
        ]
    });
}

module.exports = getLogger;