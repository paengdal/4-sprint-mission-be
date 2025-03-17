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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const mock_js_1 = require("./mock.js");
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // 기존 데이터 삭제
        // await prisma.orderItem.deleteMany();
        // await prisma.order.deleteMany();
        // await prisma.userPreference.deleteMany();
        // await prisma.user.deleteMany();
        yield prisma.product.deleteMany();
        // 목 데이터 삽입
        yield prisma.product.createMany({
            data: mock_js_1.PRODUCTS,
            skipDuplicates: true,
        });
        // await Promise.all(
        //   USERS.map(async (user) => {
        //     await prisma.user.create({ data: user });
        //   })
        // );
        // await prisma.userPreference.createMany({
        //   data: USER_PREFERENCES,
        //   skipDuplicates: true,
        // });
        // await prisma.order.createMany({
        //   data: ORDERS,
        //   skipDuplicates: true,
        // });
        // await prisma.orderItem.createMany({
        //   data: ORDER_ITEMS,
        //   skipDuplicates: true,
        // });
    });
}
main()
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}))
    .catch((e) => __awaiter(void 0, void 0, void 0, function* () {
    console.error(e);
    yield prisma.$disconnect();
    process.exit(1);
}));
