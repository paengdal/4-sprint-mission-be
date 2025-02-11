import { PrismaClient } from '@prisma/client';
import express from 'express';
import { assert } from 'superstruct';
import asyncHandler from '../controllers/asyncHandler.js';
import { CreateComment, CreateProduct, PatchProduct } from '../structs.js';

const router = express.Router();
const prisma = new PrismaClient();

// 상품 등록 API
router.post(
  '/',
  asyncHandler(async (req, res) => {
    assert(req.body, CreateProduct);
    const newProduct = await prisma.product.create({
      data: req.body,
    });
    res.status(201).send(newProduct);
  })
);

// 상품 수정 API
router.patch(
  '/:productId',
  asyncHandler(async (req, res) => {
    assert(req.body, PatchProduct);
    const productId = req.params.productId;
    const product = await prisma.product.update({
      where: { id: productId },
      data: { ...req.body },
    });
    res.send(product);
  })
);

// 상품 삭제 API
router.delete(
  '/:productId',
  asyncHandler(async (req, res) => {
    const productId = req.params.productId;
    await prisma.product.delete({ where: { id: productId } });
    res.sendStatus(204);
  })
);

// 상품 목록 조회 API
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { sort = 'latest', skip = 0, limit = 10, keyword } = req.query;

    // sort에 따라 최신순, 좋아요순 결정
    const orderBy =
      sort === 'latest' ? { createdAt: 'desc' } : { favoriteCount: 'desc' };
    const where = keyword
      ? {
          OR: [
            { name: { contains: keyword } },
            { description: { contains: keyword } },
          ],
        }
      : {};

    const products = await prisma.product.findMany({
      select: { id: true, name: true, price: true, createdAt: true },
      orderBy,
      skip: parseInt(skip),
      take: parseInt(limit),
      where,
    });
    /**
     * collection의 전체 document 개수 받아오기
     * - pagination 구현에 필요
     * - searchCount가 있어 현 상황에서 toatalCount는 없어도 될 것으로 보이나 일단 살려둠(2024.11.28)
     */
    // const totalCount = await Product.count();
    // skip, limit이 반영되지 않은 전체 검색 결과 개수
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
router.get('/:productId', async (req, res) => {
  console.log('start getProduct');
  const userId = req.userId;
  // if (!userId) throw new Error('401/Unauthorized');
  // const userId = '7481dd96-fe6a-4ecf-a3c6-5877544707e7';
  const { productId } = req.params;
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      writer: true,
      price: true,
      tags: true,
      description: true,
      createdAt: true,
      comments: { select: { id: true, content: true, createdAt: true } },
    },
  });
  // console.log('userId in getProduct', req);
  // const existingLiked = await prisma.productLike.findFirst({
  //   where: { productId_userId: { productId, userId } },
  // });
  const existingLiked = await prisma.productLike.findFirst({
    where: { productId, userId },
  });

  const favoriteCount = await prisma.productLike.count({
    where: { productId },
  });
  const isFavorite = !!existingLiked;
  const newProduct = { ...product, isFavorite, favoriteCount };
  console.log(existingLiked);
  console.log('req.userId in getProduct', req.userId);
  console.log(newProduct);
  res.send(newProduct);
});

// 댓글 등록 API - 상품
router.post(
  '/:productId/comments',
  asyncHandler(async (req, res) => {
    console.log('do this?');
    assert(req.body, CreateComment);
    console.log('do this2');
    // 댓글 테이블에 댓글 생성
    console.log(req.body);
    const comment = await prisma.comment.create({ data: req.body });

    // 해당 상품에 댓글을 연결
    const { id: commentId } = comment;
    const { productId } = req.params;
    const { comments } = await prisma.product.update({
      where: { id: productId },
      data: { comments: { connect: { id: commentId } } },
      include: { comments: true },
    });
    res.status(201).send(comments);
  })
);

// 댓글 목록 조회 API - 중고마켓
// 상품 정보에 댓글 목록이 배열로 있으므로 불필요할 수도
router.get(
  '/:productId/comments',
  asyncHandler(async (req, res) => {
    // 전달된 cursor가 있을 경우 생성일을 기준으로 cursor 생성
    const { productId } = req.params;
    const { cursor, limit = 10 } = req.query;
    const cursorOption =
      cursor || cursor !== ''
        ? {
            skip: 1,
            cursor: {
              id: cursor,
            },
          }
        : {};
    const comments = await prisma.comment.findMany({
      where: { productId },
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      ...cursorOption,
    });
    // nextCursor 설정
    let nextCursor;
    let isLastPage = false;
    if (cursor) {
      const lastComment = comments[comments.length - 1];
      nextCursor = lastComment.id;
      isLastPage = limit > comments.length;
    }
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

// 상품에 좋아요 하기
router.post('/:productId/like', async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.userId;

    if (!userId) throw new Error('401/Unauthorized');

    await prisma.productLike.create({ data: { userId, productId } });

    res.status(201).send('Liked!');
  } catch (error) {
    next(error);
  }
});

// 상품에 좋아요 취소하기
router.delete('/:productId/unlike', async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.userId;

    if (!userId) throw new Error('401/Unauthorized');

    await prisma.productLike.delete({
      where: { productId_userId: { userId, productId } },
    });

    res.status(201).send('Unliked!');
  } catch (error) {
    next(error);
  }
});

export default router;
