import { PrismaClient } from '@prisma/client';
import express from 'express';
import { assert } from 'superstruct';
import asyncHandler from '../controllers/asyncHandler.js';
import { CreateArticle, CreateComment, PatchArticle } from '../structs.js';

const router = express.Router();
const prisma = new PrismaClient();

// 게시글 등록 API
router.post(
  '/',
  asyncHandler(async (req, res) => {
    assert(req.body, CreateArticle);
    const article = await prisma.article.create({ data: req.body });
    // res.status(201).send(article);
    res.status(201).send(article.id);
  })
);

// 게시글 수정 API
router.patch(
  '/:articleId',
  asyncHandler(async (req, res) => {
    assert(req.body, PatchArticle);
    const { articleId } = req.params;
    const article = await prisma.article.update({
      where: { id: articleId },
      data: { ...req.body },
    });
    res.send(article);
  })
);

// 게시글 삭제 API
router.delete(
  '/:articleId',
  asyncHandler(async (req, res) => {
    const { articleId } = req.params;
    await prisma.article.delete({ where: { id: articleId } });
    res.sendStatus(204);
  })
);

// 게시글 목록 조회 API
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { sort = 'latest', skip = 0, limit = 5, keyword } = req.query;

    // sort에 따라 최신순, 좋아요순 결정
    const orderBy =
      sort === 'latest' ? { createdAt: 'desc' } : { createdAt: 'asc' };
    // sort === 'latest' ? { createdAt: 'desc' } : { favoriteCount: 'desc' };
    const where = keyword
      ? {
          OR: [
            { title: { contains: keyword } },
            { content: { contains: keyword } },
          ],
        }
      : {};
    const articles = await prisma.article.findMany({
      select: { id: true, title: true, content: true, createdAt: true },
      orderBy,
      skip: parseInt(skip),
      take: parseInt(limit),
      where,
    });
    res.send(articles);
  })
);

// 게시글 상세 조회 API - 댓글 목록도 함께 조회
router.get(
  '/:articleId',
  asyncHandler(async (req, res) => {
    const { articleId } = req.params;
    const product = await prisma.article.findUniqueOrThrow({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
        writer: true,
        content: true,
        createdAt: true,
        comments: { select: { id: true, content: true, createdAt: true } },
      },
    });
    res.send(product);
  })
);

// 댓글 등록 API - 게시글
router.post(
  '/:articleId/comments',
  asyncHandler(async (req, res) => {
    assert(req.body, CreateComment);
    // 댓글 테이블에 댓글 생성
    const comment = await prisma.comment.create({ data: req.body });

    // 해당 게시글에 댓글을 연결
    const { id: commentId } = comment;
    const { articleId } = req.params;
    const { comments } = await prisma.article.update({
      where: { id: articleId },
      data: { comments: { connect: { id: commentId } } },
      include: { comments: true },
    });
    res.status(201).send(comments);
  })
);

// 댓글 목록 조회 API - 자유게시판
// 게시글 정보에 댓글 목록이 배열로 있으므로 불필요할 수도
router.get(
  '/:articleId/comments',
  asyncHandler(async (req, res) => {
    const { articleId } = req.params;
    const { cursor, limit = 10 } = req.query;
    const cursorOption =
      cursor && cursor !== ''
        ? {
            skip: 1,
            cursor: {
              id: cursor,
            },
          }
        : {};
    const comments = await prisma.comment.findMany({
      where: { articleId },
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

export default router;
