import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

function authentication(req: Request, res: Response, next: NextFunction) {
  const jwtSecretKey = process.env.JWT_SECRET_KEY;
  console.log('do authentication');
  if (req.url === '/users/sign-up' || req.url === '/users/log-in') {
    next();
    return;
  }
  const authorization = req.headers.authorization;
  if (!authorization) {
    next();
    return;
  }
  const accessToken = authorization.split('Bearer ')[1];
  if (!accessToken) {
    res.status(400).send('Wrong token received...');
    return;
  }

  try {
    console.log('do authentication try', jwtSecretKey);
    if (!jwtSecretKey) throw new Error('400/JwtSecretKey not founded');
    // const { sub } = jwt.verify(accessToken, jwtSecretKey);
    const sub = jwt.verify(accessToken, jwtSecretKey).sub as string | undefined;
    req.userId = sub;

    next();
  } catch (error: unknown) {
    // 인증 실패
    // 유효시간이 초과된 경우
    const err = error as Error;
    if (err.name === 'TokenExpiredError') {
      res.status(419).json({
        code: 419,
        message: '토큰이 만료되었습니다.',
      });
      return;
    }
    // 토큰의 비밀키가 일치하지 않는 경우
    if (err.name === 'JsonWebTokenError') {
      res.status(401).json({
        code: 401,
        message: '유효하지 않은 토큰입니다.',
      });
      return;
    }
  }
  // return next();
}

export default authentication;
