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
// 특정 댓글 조회 API
router.get('/:commentId', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.commentId;
        const comment = yield prisma.comment.findUniqueOrThrow({
            where: { id },
        });
        res.send(comment);
    }
    catch (error) {
        next(error);
    }
}));
// 댓글 전체 목록 조회 API
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const comments = yield prisma.comment.findMany({
            where: { NOT: { articleId: null } },
        });
        res.send(comments);
    }
    catch (error) {
        next(error);
    }
}));
// 특정 상품의 댓글 목록 조회 API
// router.get(
//   '/products/:id/comments',
//   asyncHandler(async (req, res) => {
//     const { id: productId } = req.params;
//     const { cursor, limit = 2 } = req.query;
//     const cursorOption = cursor
//       ? {
//           skip: 1,
//           cursor: {
//             id: cursor,
//           },
//         }
//       : {};
//     const comments = await prisma.comment.findMany({
//       where: { productId },
//       ...cursorOption,
//       take: parseInt(limit),
//     });
//     res.send(comments);
//   })
// );
// 특정 게시글의 댓글 목록 조회 API
// router.get(
//   '/articles/:id/comments',
//   asyncHandler(async (req, res) => {
//     const { id: articleId } = req.params;
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
//       where: { articleId },
//       ...cursorOption,
//     });
//     res.send(comments);
//   })
// );
// 댓글 수정 API
router.patch('/:commentId', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, superstruct_1.assert)(req.body, structs_1.PatchComment);
        const id = req.params.commentId;
        const comment = yield prisma.comment.update({
            where: { id },
            data: req.body,
        });
        res.send(comment);
    }
    catch (error) {
        next(error);
    }
}));
// 댓글 삭제 API
// 댓글 삭제 시 연결은 별도로 해제(disconnect)하지 않아도 되는지??
router.delete('/:commentId', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { commentId } = req.params;
        yield prisma.comment.delete({ where: { id: commentId } });
        res.sendStatus(204);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
