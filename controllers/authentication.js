import jwt from 'jsonwebtoken';

function authentication(req, res, next) {
  // console.log('authentication 1', req.headers);
  if (req.url === '/users/sign-up' || req.url === '/users/log-in')
    return next();
  // console.log('req.headers', req.headers);
  const authorization = req.headers.authorization;
  console.log('authentication 2', authorization);
  if (!authorization) return next();
  console.log('authentication 3');
  const accessToken = authorization.split('Bearer ')[1];
  if (!accessToken) return res.status(400).send('Wrong token received...');

  try {
    console.log('do authentication try catch');
    const { sub } = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
    req.userId = sub;
    console.log('req.userId in authentication', req.userId);

    next();
  } catch (error) {
    // 인증 실패
    // 유효시간이 초과된 경우
    if (error.name === 'TokenExpiredError') {
      return res.status(419).json({
        code: 419,
        message: '토큰이 만료되었습니다.',
      });
    }
    // 토큰의 비밀키가 일치하지 않는 경우
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: '유효하지 않은 토큰입니다.',
      });
    }
  }
  // next();
}

export default authentication;
