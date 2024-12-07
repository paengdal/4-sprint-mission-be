import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import { PrismaClient, Prisma } from '@prisma/client';
import { assert, create } from 'superstruct';
import { CreateProduct, PatchProduct, CreateArticle, PatchArticle } from './structs.js';

dotenv.config();
const prisma = new PrismaClient();
export const app = express();
app.use(cors());
// const corsOptions = {
//   origin: ["http://127.0.0.1:5500", "https://my-todo.com"],
// };
// app.use(cors(corsOptions));
// 특정 주소에 대해서만 cors 허용. 이게 더 안전함
app.use(express.json());
// 앱 전체에서 express.json()을 사용하겠다는 의미
// req의 content-type이 application/json이면 이를 parsing해서 req body에 js객체로 담아줌)`
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// 비동기 오류 처리를 위한 함수(하지 않으면 오류 시 서버 자체가 죽어버림)
function asyncHandler(handler) {
  return async function (req, res) {
    try {
      await handler(req, res);
    } catch (e) {
      if (e.name === 'StructError' || e instanceof Prisma.PrismaClientValidationError) {
        res.status(400).send({
          message: e.message,
        });
      } else if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        res.sendStatus(404);
      } else {
        res.status(500).send({
          message: e.message,
        });
      }
    }
  };
}

/************* 게시글 *************/
// app.post('/articles', )

/************* 상품 *************/
// 상품 등록 API
app.post(
  '/products',
  asyncHandler(async (req, res) => {
    assert(req.body, CreateProduct);
    const newProduct = await prisma.product.create({
      data: req.body,
    });
    res.status(201).send(newProduct);
  })
);

// 상품 상세 조회 API
app.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await prisma.product.findUniqueOrThrow({
      where: { id },
      select: { id: true, name: true, price: true, tags: true, description: true, createdAt: true },
    });
    res.send(product);
  })
);

// 상품 목록 조회 API
app.get(
  '/products',
  asyncHandler(async (req, res) => {
    const { sort = 'recent', offset = 0, limit = 10, keyword } = req.query;

    // sort에 따라 최신순, 좋아요순 결정
    const orderBy = sort === 'recent' ? { createdAt: 'desc' } : { favoriteCount: 'desc' };
    const where = keyword
      ? { OR: [{ name: { contains: keyword } }, { description: { contains: keyword } }] }
      : {};

    const products = await prisma.product.findMany({
      select: { id: true, name: true, price: true, createdAt: true },
      orderBy,
      skip: parseInt(offset),
      take: parseInt(limit),
      where,
    });
    /**
     * collection의 전체 document 개수 받아오기
     * - pagination 구현에 필요
     * - searchCount가 있어 현 상황에서 toatalCount는 없어도 될 것으로 보이나 일단 살려둠(2024.11.28)
     */
    // const totalCount = await Product.count();
    // offset, limit이 반영되지 않은 전체 검색 결과 개수
    const searchCount = await prisma.product.count({ where });

    const finalData = {
      // totalCount: totalCount,
      searchCount: searchCount,
      products: products,
    };
    res.send(finalData);
  })
);

// 상품 수정 API
app.patch(
  '/products/:id',
  asyncHandler(async (req, res) => {
    assert(req.body, PatchProduct);
    const id = req.params.id;
    const product = await prisma.product.update({ where: { id }, data: { ...req.body } });
    res.send(product);
  })
);

// 상품 삭제 API
app.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    await prisma.product.delete({ where: { id } });
    res.sendStatus(204);
  })
);

app.listen(process.env.PORT || 3000, () => console.log('Server Started'));
