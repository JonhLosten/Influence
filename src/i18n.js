"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLang = getLang;
exports.setLang = setLang;
exports.t = t;
const fr_json_1 = __importDefault(require("./locales/fr.json"));
const en_json_1 = __importDefault(require("./locales/en.json"));
const DICTS = { fr: fr_json_1.default, en: en_json_1.default };
const STORAGE_KEY = 'influenceops.lang';
function getLang() {
    const v = localStorage.getItem(STORAGE_KEY);
    return (v === 'en' || v === 'fr') ? v : 'fr';
}
function setLang(l) {
    localStorage.setItem(STORAGE_KEY, l);
    window.location.reload();
}
function t(key) {
    const lang = getLang();
    const dict = DICTS[lang] || DICTS.fr;
    return dict[key] || key;
}
