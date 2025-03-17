import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';

function checkValidate(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
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

export default checkValidate;
