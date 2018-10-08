var http = require('http');

class HttpError extends Error {
    constructor(status, message) {
        super();
        Error.apply(this, arguments);
        Error.captureStackTrace(this, HttpError);

        this.status = status;
        this.message = message || http.STATUS_CODES[status] || "Error";
    }
}

HttpError.prototype.name = 'HttpError';

exports.HttpError = HttpError;


