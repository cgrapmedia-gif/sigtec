"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbateModule = void 0;
const common_1 = require("@nestjs/common");
const pdf_module_1 = require("../pdf/pdf.module");
const abate_service_1 = require("./abate.service");
const abate_controller_1 = require("./abate.controller");
let AbateModule = class AbateModule {
};
exports.AbateModule = AbateModule;
exports.AbateModule = AbateModule = __decorate([
    (0, common_1.Module)({ imports: [pdf_module_1.PdfModule], providers: [abate_service_1.AbateService], controllers: [abate_controller_1.AbateController] })
], AbateModule);
