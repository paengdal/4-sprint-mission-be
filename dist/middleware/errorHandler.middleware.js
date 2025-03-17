"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function errorHandler(err, req, res, next) {
    console.error(err);
    const [statusCodeText, message] = err.message.split('/');
    const statusCode = Number(statusCodeText);
    if (isNaN(statusCode)) {
        res.status(500).send('Unknown error');
        return;
    }
    res.status(statusCode).send(message);
}
exports.default = errorHandler;
