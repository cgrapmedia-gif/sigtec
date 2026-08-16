"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserActual = void 0;
const common_1 = require("@nestjs/common");
exports.UserActual = (0, common_1.createParamDecorator)((_data, ctx) => {
    return ctx.switchToHttp().getRequest().user;
});
