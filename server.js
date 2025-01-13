import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import { PrismaClient, Prisma } from '@prisma/client';
import { assert, create, pick } from 'superstruct';
import {
  CreateProduct,
  PatchProduct,
  CreateArticle,
  PatchArticle,
  CreateComment,
  PatchComment,
} from './structs.js';

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

/************* 댓글 *************/
// 댓글 등록 API - 중고마켓
app.post(
  '/products/:id/comments',
  asyncHandler(async (req, res) => {
    assert(req.body, CreateComment);
    // 댓글 테이블에 댓글 생성
    const comment = await prisma.comment.create({ data: req.body });

    // 해당 상품에 댓글을 연결
    const { id: commentId } = comment;
    const { id: productId } = req.params;
    const { comments } = await prisma.product.update({
      where: { id: productId },
      data: { comments: { connect: { id: commentId } } },
      include: { comments: true },
    });
    res.status(201).send(comments);
  })
);

// 댓글 등록 API - 자유게시판
app.post(
  '/articles/:id/comments',
  asyncHandler(async (req, res) => {
    assert(req.body, CreateComment);
    // 댓글 테이블에 댓글 생성
    const comment = await prisma.comment.create({ data: req.body });

    // 해당 게시글에 댓글을 연결
    const { id: commentId } = comment;
    const { id: articleId } = req.params;
    const { comments } = await prisma.article.update({
      where: { id: articleId },
      data: { comments: { connect: { id: commentId } } },
      include: { comments: true },
    });
    res.status(201).send(comments);
  })
);

// 댓글 수정 API
app.patch(
  '/comments/:id',
  asyncHandler(async (req, res) => {
    assert(req.body, PatchComment);
    const { id } = req.params;
    const comment = await prisma.comment.update({ where: { id }, data: { ...req.body } });
    res.send(comment);
  })
);

// 댓글 삭제 API
// 댓글 삭제 시 연결은 별도로 해제(disconnect)하지 않아도 되는지??
app.delete(
  '/comments/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.comment.delete({ where: { id } });
    res.sendStatus(204);
  })
);

// 댓글 목록 조회 API - 중고마켓
app.get(
  '/products/comments',
  asyncHandler(async (req, res) => {
    // 전달된 cursor가 있을 경우 생성일을 기준으로 cursor 생성
    const { cursor, limit = 10 } = req.query;
    const cursorOption = cursor
      ? {
          skip: 1,
          cursor: {
            id: cursor,
          },
        }
      : {};
    const comments = await prisma.comment.findMany({
      where: { NOT: { productId: null } },
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      ...cursorOption,
    });
    const lastComment = comments[comments.length - 1];
    const nextCursor = lastComment.id;
    const isLastPage = limit > comments.length;
    // 최종적으로 cursor와 comments 전달
    const finalData = isLastPage
      ? { comments } // 마지막 페이지이면 cursor전달하지 않음
      : {
          cursor: nextCursor,
          comments,
        };
    res.send(finalData);
  })
);
// 댓글 목록 조회 API - 자유게시판
app.get(
  '/articles/comments',
  asyncHandler(async (req, res) => {
    // 전달된 cursor가 있을 경우 생성일을 기준으로 cursor 생성
    const { cursor, limit = 10 } = req.query;
    const cursorOption = cursor
      ? {
          skip: 1,
          cursor: {
            id: cursor,
          },
        }
      : {};
    const comments = await prisma.comment.findMany({
      where: { NOT: { articleId: null } },
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      ...cursorOption,
    });
    const lastComment = comments[comments.length - 1];
    const nextCursor = lastComment.id;
    const isLastPage = limit > comments.length;
    // 최종적으로 cursor와 comments 전달
    const finalData = isLastPage
      ? { comments } // 마지막 페이지이면 cursor전달하지 않음
      : {
          cursor: nextCursor,
          comments,
        };
    res.send(finalData);
  })
);
// // 댓글 목록 조회 API - 통합
// app.get(
//   '/:group/comments',
//   asyncHandler(async (req, res) => {
//     // 중고마켓인지 자유게시판인지 체크
//     const { group } = req.params;
//     const checkCmtId =
//       group === 'products'
//         ? { NOT: { productId: null } }
//         : group === 'articles'
//         ? { NOT: { articleId: null } }
//         : { id: 1 }; // 조건 미충족 시(잘못된 엔드포인트 입력 시) 아무것도 조회되지 않도록

//     // 전달된 cursor가 있을 경우 생성일을 기준으로 cursor 생성
//     const { cursor, limit = 10 } = req.query;
//     const cursorOption = cursor
//       ? {
//           skip: 1,
//           cursor: {
//             id: cursor,
//           },
//         }
//       : {};
//     const comments = await prisma.comment.findMany({
//       where: checkCmtId,
//       take: parseInt(limit),
//       orderBy: { createdAt: 'desc' },
//       ...cursorOption,
//     });
//     const lastComment = comments[comments.length - 1];
//     const nextCursor = lastComment.id;
//     const isLastPage = limit > comments.length;
//     // 최종적으로 cursor와 comments 전달
//     const finalData = isLastPage
//       ? { comments } // 마지막 페이지이면 cursor전달하지 않음
//       : {
//           cursor: nextCursor,
//           comments,
//         };
//     res.send(finalData);
//   })
// );

/************* 게시글 *************/
// 게시글 등록 API
app.post(
  '/articles',
  asyncHandler(async (req, res) => {
    assert(req.body, CreateArticle);
    const article = await prisma.article.create({ data: req.body });
    res.status(201).send(article);
  })
);

// 게시글 수정 API
app.patch(
  '/articles/:id',
  asyncHandler(async (req, res) => {
    assert(req.body, PatchArticle);
    const { id } = req.params;
    const article = await prisma.article.update({ where: { id }, data: { ...req.body } });
    res.send(article);
  })
);

// 게시글 삭제 API
app.delete(
  '/articles/:Id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.article.delete({ where: { id } });
    res.sendStatus(204);
  })
);

// 게시글 목록 조회 API
app.get(
  '/articles',
  asyncHandler(async (req, res) => {
    const { sort = 'recent', offset = 0, limit = 5, keyword } = req.query;

    // sort에 따라 최신순, 좋아요순 결정
    const orderBy = sort === 'recent' ? { createdAt: 'desc' } : { favoriteCount: 'desc' };
    const where = keyword
      ? { OR: [{ name: { contains: keyword } }, { content: { contains: keyword } }] }
      : {};
    const articles = await prisma.article.findMany({
      select: { id: true, title: true, content: true, createdAt: true },
      orderBy,
      skip: parseInt(offset),
      take: parseInt(limit),
      where,
    });
    res.send(articles);
  })
);

// 게시글 상세 조회 API - 댓글 목록도 함께 조회
app.get(
  '/articles/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await prisma.article.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        comments: { select: { id: true, content: true, createdAt: true } },
      },
    });
    res.send(product);
  })
);

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

// 상품 상세 조회 API - 댓글 목록 함께 조회
app.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await prisma.product.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        name: true,
        price: true,
        tags: true,
        description: true,
        createdAt: true,
        comments: { select: { id: true, content: true, createdAt: true } },
      },
    });
    res.send(product);
  })
);

app.listen(process.env.PORT || 3000, () => console.log('Server Started'));
