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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatchComment = exports.CreateComment = exports.PatchArticle = exports.CreateArticle = exports.PatchProduct = exports.CreateProduct = void 0;
const s = __importStar(require("superstruct"));
exports.CreateProduct = s.object({
    writer: s.size(s.string(), 1, 30),
    name: s.size(s.string(), 1, 20),
    description: s.size(s.string(), 10, 100),
    price: s.min(s.integer(), 1),
    tags: s.size(s.array(s.size(s.string(), 1, 5)), 1, Infinity), // 배열의 길이가 1이상 infinity
    imgUrls: s.size(s.array(s.size(s.string(), 1, 100)), 1, 3), // 배열의 길이가 1이상 3개까지
});
exports.PatchProduct = s.partial(exports.CreateProduct);
exports.CreateArticle = s.object({
    title: s.size(s.string(), 1, 30),
    writer: s.size(s.string(), 1, 30),
    content: s.size(s.string(), 10, 500),
});
exports.PatchArticle = s.partial(exports.CreateArticle);
exports.CreateComment = s.object({
    writer: s.size(s.string(), 1, 30),
    content: s.size(s.string(), 1, 200),
});
exports.PatchComment = s.partial(exports.CreateComment);
