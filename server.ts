import bodyParser from 'body-parser';
// import cors from 'node';
import cors from 'cors';
import * as dotenv from 'dotenv';
import express from 'express';
// import swaggerUi from 'swagger-ui-express';
// import authentication from './middleware/authentication.middleware';
// import errorHandler from './middleware/errorHandler.middleware';
import authentication from './middleware/authentication.middleware';
import errorHandler from './middleware/errorHandler.middleware';
import articlesRouter from './routes/articles.routes';
import commentsRouter from './routes/comments.routes';
import productsRouter from './routes/products.routes';
import usersRouter from './routes/users.routes';
// import swaggerFile from './swagger/swagger-output.json';

dotenv.config();
export const app = express();
app.use(cors());
// const corsOptions = {
//   origin: ["http://127.0.0.1:5500", "https://my-todo.com"],
// };
// app.use(cors(corsOptions));
// 특정 주소에 대해서만 cors 허용. 이게 더 안전함
app.use(express.json());
app.use(authentication);
// 앱 전체에서 express.json()을 사용하겠다는 의미
// req의 content-type이 application/json이면 이를 parsing해서 req body에 js객체로 담아줌)`
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// 이미지 경로 설정
app.use('/static', express.static('public'));

// API 라우팅
app.use('/products', productsRouter);
app.use('/articles', articlesRouter);
app.use('/comments', commentsRouter);
app.use('/users', usersRouter);
// app.use(
//   '/api-docs',
//   swaggerUi.serve,
//   swaggerUi.setup(swaggerFile, { explorer: true })
// );

app.use(errorHandler);

app.listen(process.env.PORT || 5500, () => console.log('Server Started'));
