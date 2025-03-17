"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
function checkValidate(req, res, next) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (errors.isEmpty()) {
        next();
        return;
    }
    console.log(errors);
    res
        .status(400)
        .json({ message: errors.array({ onlyFirstError: true })[0].msg });
    return;
}
exports.default = checkValidate;
