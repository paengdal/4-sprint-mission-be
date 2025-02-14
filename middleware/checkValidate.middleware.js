import { validationResult } from 'express-validator';

function checkValidate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  console.log(errors);
  return res
    .status(400)
    .json({ message: errors.array({ onlyFirstError: true })[0].msg });
  // return res.status(400).json({
  //   // onlyFirstError를 설정하지 않으면 동일한 에러가 두 번 찍힌다
  //   bodyValidationErrors: errors.array({ onlyFirstError: true }),
  // });
}

export default checkValidate;
