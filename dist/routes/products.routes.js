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
const express_validator_1 = require("express-validator");
const multer_1 = __importDefault(require("multer"));
const superstruct_1 = require("superstruct");
const checkValidate_middleware_1 = __importDefault(require("../middleware/checkValidate.middleware"));
const structs_1 = require("../structs");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/');
    },
    filename: function (req, file, cb) {
        console.log(file);
        const extension = file.originalname.split('.').slice(-1)[0];
        cb(null, 'product' + '-' + Date.now() + '.' + extension);
    },
});
const upload = (0, multer_1.default)({ storage: storage });
const uploadMiddleware = upload.array('imgUrls');
// 상품 등록 API
router.post('/', uploadMiddleware, (0, express_validator_1.body)('name')
    .exists()
    .isLength({ min: 1, max: 20 })
    .withMessage('상품명은 1-20글자입니다.'), (0, express_validator_1.body)('description')
    .exists()
    .isLength({ min: 10, max: 100 })
    .withMessage('상품 소개는 10-100글자입니다.'), checkValidate_middleware_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = req.files;
        if (!files || files.length === 0)
            return;
        const newImgUrls = files.map((file) => 'http://localhost:5500/static/' + file.filename);
        const arrayTags = req.body.tags.split(',');
        const intPrice = Number(req.body.price);
        req.body.imgUrls = newImgUrls;
        req.body.tags = arrayTags;
        req.body.price = intPrice;
        (0, superstruct_1.assert)(req.body, structs_1.CreateProduct);
        const newProduct = yield prisma.product.create({
            data: req.body,
        });
        res.status(201).send(newProduct);
    }
    catch (error) {
        next(error);
    }
}));
// 상품 수정 API
router.patch('/:productId', uploadMiddleware, (0, express_validator_1.body)('name')
    .exists()
    .isLength({ min: 1, max: 20 })
    .withMessage('상품명은 1-20글자입니다.'), (0, express_validator_1.body)('description')
    .exists()
    .isLength({ min: 10, max: 100 })
    .withMessage('상품 소개는 10-100글자입니다.'), checkValidate_middleware_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = req.files;
        let newImgUrls;
        if (files && files.length !== 0) {
            newImgUrls = files.map((file) => 'http://localhost:5500/static/' + file.filename);
        }
        const arrayTags = req.body.tags.split(',');
        const intPrice = Number(req.body.price);
        req.body.imgUrls = newImgUrls;
        req.body.tags = arrayTags;
        req.body.price = intPrice;
        (0, superstruct_1.assert)(req.body, structs_1.PatchProduct);
        const productId = req.params.productId;
        const product = yield prisma.product.update({
            where: { id: productId },
            data: Object.assign({}, req.body),
        });
        res.status(200).send(product);
    }
    catch (error) {
        next(error);
    }
}));
// 상품 삭제 API
router.delete('/:productId', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productId = req.params.productId;
        yield prisma.product.delete({ where: { id: productId } });
        res.sendStatus(204);
    }
    catch (error) {
        next(error);
    }
}));
// 상품 목록 조회 API
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const { sort = 'recent', skip = 0, limit = 10, keyword } = req.query;
        const sort = (req.query.sort || 'recent');
        const skip = (req.query.skip || '0');
        const limit = (req.query.limit || '10');
        const keyword = req.query.keyword;
        const where = keyword
            ? {
                OR: [
                    { name: { contains: keyword } },
                    { description: { contains: keyword } },
                ],
            }
            : {};
        const products = yield prisma.product.findMany({
            select: {
                id: true,
                name: true,
                price: true,
                imgUrls: true,
                productLikes: true,
                createdAt: true,
                // include: { _count: { select: { productLikes: true } } },
                _count: { select: { productLikes: true } },
            },
            orderBy: sort === 'recent'
                ? { createdAt: 'desc' }
                : { productLikes: { _count: 'desc' } },
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
        const searchCount = yield prisma.product.count({ where });
        res.send({ products, searchCount });
    }
    catch (error) {
        next(error);
    }
}));
// 상품 상세 조회 API - 댓글 목록 함께 조회
router.get('/:productId', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { productId } = req.params;
        const product = yield prisma.product.findUniqueOrThrow({
            where: { id: productId },
            select: {
                id: true,
                name: true,
                writer: true,
                price: true,
                tags: true,
                description: true,
                createdAt: true,
                imgUrls: true,
                _count: { select: { productLikes: true } },
                comments: {
                    select: { id: true, content: true, createdAt: true, updatedAt: true },
                },
            },
        });
        const isFavorite = userId
            ? yield prisma.productLike
                .findUnique({
                where: { productId_userId: { productId, userId } },
            })
                .then((value) => !!value)
            : false;
        const newProduct = {
            id: product.id,
            name: product.name,
            writer: product.writer,
            price: product.price,
            tags: product.tags,
            description: product.description,
            createdAt: product.createdAt,
            imgUrls: product.imgUrls,
            count: product._count.productLikes,
            comments: product.comments,
            isFavorite,
        };
        res.send(newProduct);
    }
    catch (error) {
        next(error);
    }
}));
// 댓글 등록 API - 상품
router.post('/:productId/comments', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, superstruct_1.assert)(req.body, structs_1.CreateComment);
        // 댓글 테이블에 댓글 생성
        const comment = yield prisma.comment.create({ data: req.body });
        // 해당 상품에 댓글을 연결
        const { id: commentId } = comment;
        const { productId } = req.params;
        const { comments } = yield prisma.product.update({
            where: { id: productId },
            data: { comments: { connect: { id: commentId } } },
            include: { comments: true },
        });
        res.status(201).send(comments);
    }
    catch (error) {
        next(error);
    }
}));
// 댓글 목록 조회 API - 중고마켓
// 상품 정보에 댓글 목록이 배열로 있으므로 불필요할 수도
router.get('/:productId/comments', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 전달된 cursor가 있을 경우 생성일을 기준으로 cursor 생성
        const { productId } = req.params;
        // const { cursor, limit = 10 } = req.query;
        const cursor = req.query.cursor;
        const limit = req.query.limit;
        const skip = cursor || cursor !== '' ? 1 : 0;
        const cursorOption = cursor || cursor !== '' ? { id: cursor } : { id: undefined };
        const comments = yield prisma.comment.findMany({
            where: { productId },
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' },
            cursor: cursorOption,
            skip,
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
// 상품에 좋아요 하기
router.post('/:productId/like', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId } = req.params;
        const userId = req.userId;
        if (!userId)
            throw new Error('401/Unauthorized');
        console.log(productId, userId);
        // transaction 사용
        yield prisma.$transaction([
            prisma.productLike.create({ data: { userId, productId } }),
            // // 해당 상품의 favoriteCount +1
            // prisma.product.update({
            //   where: { id: productId },
            //   data: { favoriteCount: { increment: 1 } },
            // }),
        ]);
        res.status(201).send('Liked!');
    }
    catch (error) {
        next(error);
    }
}));
// 상품에 좋아요 취소하기
router.delete('/:productId/unlike', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId } = req.params;
        const userId = req.userId;
        if (!userId)
            throw new Error('401/Unauthorized');
        yield prisma.$transaction([
            prisma.productLike.delete({
                where: { productId_userId: { userId, productId } },
            }),
            // // 해당 상품의 favoriteCount -1
            // prisma.product.update({
            //   where: { id: productId },
            //   data: { favoriteCount: { decrement: 1 } },
            // }),
        ]);
        res.status(201).send('Unliked!');
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
