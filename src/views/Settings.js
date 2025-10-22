"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Settings = Settings;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const i18n_1 = require("../i18n");
function Settings() {
    const [lang, setLangState] = react_1.default.useState((0, i18n_1.getLang)());
    function onChange(e) {
        const v = e.target.value === 'en' ? 'en' : 'fr';
        setLangState(v);
        (0, i18n_1.setLang)(v); // persists to localStorage and reloads
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "max-w-md bg-white border rounded-2xl p-4 space-y-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-xl font-semibold", children: (0, i18n_1.t)('nav.settings') }), (0, jsx_runtime_1.jsxs)("label", { className: "block", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-sm text-gray-500", children: (0, i18n_1.t)('settings.language') }), (0, jsx_runtime_1.jsxs)("select", { value: lang, onChange: onChange, className: "mt-1 w-full border rounded-lg p-2", children: [(0, jsx_runtime_1.jsx)("option", { value: "fr", children: (0, i18n_1.t)('settings.language.fr') }), (0, jsx_runtime_1.jsx)("option", { value: "en", children: (0, i18n_1.t)('settings.language.en') })] })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500", children: "Cette pr\u00E9f\u00E9rence est enregistr\u00E9e et appliqu\u00E9e \u00E0 chaque lancement." })] }));
}
