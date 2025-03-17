import { NextFunction, Request, Response } from 'express';

function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err);

  const [statusCodeText, message] = err.message.split('/');
  const statusCode = Number(statusCodeText);

  if (isNaN(statusCode)) {
    res.status(500).send('Unknown error');
    return;
  }

  res.status(statusCode).send(message);
}

export default errorHandler;
