"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const body_parser_1 = __importDefault(require("body-parser"));
// import cors from 'node';
const cors_1 = __importDefault(require("cors"));
const dotenv = __importStar(require("dotenv"));
const express_1 = __importDefault(require("express"));
// import swaggerUi from 'swagger-ui-express';
// import authentication from './middleware/authentication.middleware';
// import errorHandler from './middleware/errorHandler.middleware';
const authentication_middleware_1 = __importDefault(require("./middleware/authentication.middleware"));
const errorHandler_middleware_1 = __importDefault(require("./middleware/errorHandler.middleware"));
const articles_routes_1 = __importDefault(require("./routes/articles.routes"));
const comments_routes_1 = __importDefault(require("./routes/comments.routes"));
const products_routes_1 = __importDefault(require("./routes/products.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
// import swaggerFile from './swagger/swagger-output.json';
dotenv.config();
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)());
// const corsOptions = {
//   origin: ["http://127.0.0.1:5500", "https://my-todo.com"],
// };
// app.use(cors(corsOptions));
// 특정 주소에 대해서만 cors 허용. 이게 더 안전함
exports.app.use(express_1.default.json());
exports.app.use(authentication_middleware_1.default);
// 앱 전체에서 express.json()을 사용하겠다는 의미
// req의 content-type이 application/json이면 이를 parsing해서 req body에 js객체로 담아줌)`
exports.app.use(body_parser_1.default.json());
exports.app.use(express_1.default.urlencoded({ extended: true }));
// 이미지 경로 설정
exports.app.use('/static', express_1.default.static('public'));
// API 라우팅
exports.app.use('/products', products_routes_1.default);
exports.app.use('/articles', articles_routes_1.default);
exports.app.use('/comments', comments_routes_1.default);
exports.app.use('/users', users_routes_1.default);
// app.use(
//   '/api-docs',
//   swaggerUi.serve,
//   swaggerUi.setup(swaggerFile, { explorer: true })
// );
exports.app.use(errorHandler_middleware_1.default);
exports.app.listen(process.env.PORT || 5500, () => console.log('Server Started'));
