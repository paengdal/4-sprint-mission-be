"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = __importDefault(require("express"));
const superstruct_1 = require("superstruct");
const structs_1 = require("../structs");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// 게시글 등록 API
router.post('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, superstruct_1.assert)(req.body, structs_1.CreateArticle);
        const article = yield prisma.article.create({ data: req.body });
        res.status(201).send(article.id);
    }
    catch (error) {
        next(error);
    }
}));
// 게시글 수정 API
router.patch('/:articleId', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, superstruct_1.assert)(req.body, structs_1.PatchArticle);
        const { articleId } = req.params;
        const article = yield prisma.article.update({
            where: { id: articleId },
            data: Object.assign({}, req.body),
        });
        res.send(article);
    }
    catch (error) {
        next(error);
    }
}));
// 게시글 삭제 API
router.delete('/:articleId', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { articleId } = req.params;
        yield prisma.article.delete({ where: { id: articleId } });
        res.sendStatus(204);
    }
    catch (error) {
        next(error);
    }
}));
// 게시글 목록 조회 API
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const { sort= 'latest', skip = 0, limit = 5, keyword } = req.query;
        const sort = (req.query.sort || 'latest');
        const skip = (req.query.skip || '0');
        const limit = (req.query.limit || '5');
        const keyword = req.query.keyword;
        const where = keyword
            ? {
                OR: [
                    { title: { contains: keyword, mode: 'insensitive' } },
                    { content: { contains: keyword } },
                ],
            }
            : {};
        const articles = yield prisma.article.findMany({
            select: {
                id: true,
                writer: true,
                title: true,
                content: true,
                createdAt: true,
                updatedAt: true,
                articleLikes: true,
                _count: { select: { articleLikes: true } },
            },
            orderBy: sort === 'recent'
                ? { createdAt: 'desc' }
                : { articleLikes: { _count: 'desc' } },
            skip: parseInt(skip),
            take: parseInt(limit),
            where,
        });
        res.send(articles);
    }
    catch (error) {
        next(error);
    }
}));
// 게시글 상세 조회 API - 댓글 목록도 함께 조회
router.get('/:articleId', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { articleId } = req.params;
        const article = yield prisma.article.findUniqueOrThrow({
            where: { id: articleId },
            select: {
                id: true,
                title: true,
                writer: true,
                content: true,
                createdAt: true,
                _count: { select: { articleLikes: true } },
                comments: { select: { id: true, content: true, createdAt: true } },
            },
        });
        const isFavorite = userId
            ? yield prisma.articleLike
                .findUnique({
                where: { articleId_userId: { articleId, userId } },
            })
                .then((value) => !!value)
            : false;
        const newArticle = Object.assign(Object.assign({}, article), { isFavorite });
        res.send(newArticle);
    }
    catch (error) {
        next(error);
    }
}));
// 댓글 등록 API - 게시글
router.post('/:articleId/comments', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, superstruct_1.assert)(req.body, structs_1.CreateComment);
        // 댓글 테이블에 댓글 생성
        const comment = yield prisma.comment.create({ data: req.body });
        // 해당 게시글에 댓글을 연결
        const { id: commentId } = comment;
        const { articleId } = req.params;
        const { comments } = yield prisma.article.update({
            where: { id: articleId },
            data: { comments: { connect: { id: commentId } } },
            include: { comments: true },
        });
        res.status(201).send(comments);
    }
    catch (error) {
        next(error);
    }
}));
// 댓글 목록 조회 API - 자유게시판
// 게시글 정보에 댓글 목록이 배열로 있으므로 불필요할 수도
router.get('/:articleId/comments', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { articleId } = req.params;
        // const articleId = req.params.articleId as string;
        // const { cursor, limit = 10 } = req.query;
        const cursor = req.query.cursor;
        const limit = req.query.limit;
        // const cursorOption =
        //   cursor && cursor !== ''
        //     ? {
        //         skip: 1,
        //         cursor: {
        //           id: cursor,
        //         },
        //       }
        //     : {};
        const skip = cursor && cursor !== '' ? 1 : 0;
        const cursorOption = cursor && cursor !== '' ? { id: cursor } : { id: undefined };
        const comments = yield prisma.comment.findMany({
            where: { articleId },
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' },
            skip,
            cursor: cursorOption,
        });
        // nextCursor 설정
        let nextCursor;
        let isLastPage = false;
        if (cursor) {
            const lastComment = comments[comments.length - 1];
            nextCursor = lastComment.id;
            isLastPage = parseInt(limit) > comments.length;
        }
        // 최종적으로 cursor와 comments 전달
        const finalData = isLastPage
            ? { comments } // 마지막 페이지이면 cursor전달하지 않음
            : {
                cursor: nextCursor,
                comments,
            };
        res.send(finalData);
    }
    catch (error) {
        next(error);
    }
}));
// 게시글에 좋아요 하기
router.post('/:articleId/like', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { articleId } = req.params;
        const userId = req.userId;
        if (!userId)
            throw new Error('401/Unauthorized');
        yield prisma.$transaction([
            prisma.articleLike.create({ data: { userId, articleId } }),
            // // 해당 게시글의 favoriteCount +1
            // prisma.article.update({
            //   where: { id: articleId },
            //   data: { favoriteCount: { increment: 1 } },
            // }),
        ]);
        res.status(201).send('Liked');
    }
    catch (error) {
        next(error);
    }
}));
// 게시글에 좋아요 취소하기
router.delete('/:articleId/unlike', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { articleId } = req.params;
        const userId = req.userId;
        if (!userId)
            throw new Error('401/Unauthorized');
        yield prisma.$transaction([
            prisma.articleLike.delete({
                where: { articleId_userId: { userId, articleId } },
            }),
            // // 해당 게시글의 favoriteCount -1
            // prisma.article.update({
            //   where: { id: articleId },
            //   data: { favoriteCount: { decrement: 1 } },
            // }),
        ]);
        res.status(201).send('unliked!');
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
