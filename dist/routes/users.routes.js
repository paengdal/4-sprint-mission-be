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
const bcrypt_1 = __importDefault(require("bcrypt"));
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validator_1 = __importDefault(require("validator"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const jwtSecretKey = process.env.JWT_SECRET_KEY;
// 전체 유저 조회
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags=['User']
    try {
        const users = yield prisma.user.findMany();
        res.status(200).json(users);
    }
    catch (error) {
        next(error);
    }
}));
// 회원가입
router.post('/sign-up', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    /*
     #swagger.tags = ['User']
     #swagger.summary = '회원 가입'
     #swagger.description = '이메일과 닉네임, 비밀번호를 입력받아 회원 가입을 한다'
     #swagger.security = [{
         "bearerAuth": []
     }]
     #swagger.requestBody = {
          required: true,
          content: {
              "application/json": {
                  schema: {
                    "type": "object",
                      "properties": {
                        "email": {
                          "type": "string",
                          "required": true,
                          "example": "test@test.com"
                        },
                        "nickname": {
                          "type": "string",
                          "required": true,
                          "example": "닉네임"
                        },
                        "password": {
                          "type": "string",
                          "required": true,
                          "example": "11111111"
                        }
                      }
                  },
                  example: {
                      "email": "test@test.com",
                      "nickname": "닉네임",
                      "password": "11111111"
                  },
              },
          }
      }
      #swagger.responses[200] = {
          description: "유저 phone 수정 완료",
          content: {
              "application/json": {
                  schema: {
                      "data": {
                          "phone": "010-0000-0000",
                      }
                  },
                  example: {
                      "data": {
                          "phone": "010-1111-2222",
                      }
                  },
              }
          }
      }
  */
    try {
        const { email, nickname, password } = req.body;
        console.log(req.body);
        if (!validator_1.default.isEmail(email))
            throw new Error('400/Malformed email');
        if (!validator_1.default.isLength(password, { min: 8 }))
            throw new Error('400/Password should be at least 8 characters');
        if (validator_1.default.isEmpty(nickname))
            throw new Error('400/Too short nickname');
        // 회원가입 로직
        // 1. 이미 가입된 유저인지(email) 확인
        const existingUser = yield prisma.user.findUnique({
            where: { email },
        });
        if (existingUser)
            throw new Error('400/Already used email');
        // 2. 비밀번호 암호화
        const encryptedPassword = yield bcrypt_1.default.hash(password, 12);
        const user = yield prisma.user.create({
            data: { email, encryptedPassword, nickname, image: 'https://imgae..' },
            omit: { encryptedPassword: true },
        });
        res.status(201).json(user);
    }
    catch (error) {
        next(error);
    }
}));
// 로그인
router.post('/log-in', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!validator_1.default.isEmail(email))
            throw new Error('400/Malformed email');
        if (!validator_1.default.isLength(password, { min: 8 }))
            throw new Error('400/Password should be at least 8 characters');
        const user = yield prisma.user.findUnique({ where: { email } });
        if (!user)
            throw new Error('400/No user founded');
        const isPasswordCorrect = yield bcrypt_1.default.compare(password, user.encryptedPassword);
        if (!isPasswordCorrect)
            throw new Error('400/Wrong password');
        const payload = {
            sub: user.id,
            email: user.email,
            nickname: user.nickname,
        };
        if (!jwtSecretKey)
            throw new Error('400/JwtSecretKey not founded');
        const accessToken = jsonwebtoken_1.default.sign(payload, jwtSecretKey, { expiresIn: '10s' });
        const refreshToken = jsonwebtoken_1.default.sign(payload, jwtSecretKey, { expiresIn: '2d' });
        const data = { accessToken, refreshToken };
        res.status(200).json(data);
    }
    catch (error) {
        next(error);
    }
}));
// 토큰 재발급
router.post('/refresh-token', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { prevRefreshToken } = req.body;
        if (!jwtSecretKey)
            throw new Error('400/JwtSecretKey not founded');
        const { sub, email, nickname } = jsonwebtoken_1.default.verify(prevRefreshToken, jwtSecretKey);
        // 받아온 payload에서 iat, exp는 제외(있으면 중복값이라 에러 발생)
        const payload = { sub, email, nickname };
        const accessToken = jsonwebtoken_1.default.sign(payload, jwtSecretKey, { expiresIn: '10s' });
        const refreshToken = jsonwebtoken_1.default.sign(payload, jwtSecretKey, { expiresIn: '2d' });
        const data = { accessToken, refreshToken };
        res.status(200).json(data);
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            const error = new Error('400/Invalid token');
            return next(error);
        }
        next(error);
    }
}));
// 내 정보 조회
router.get('/me', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const me = yield prisma.user.findUnique({
            where: { id: userId },
            select: { nickname: true },
        });
        res.status(200).json(me);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
