"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sidebar = Sidebar;
const jsx_runtime_1 = require("react/jsx-runtime");
const i18n_1 = require("../i18n");
function Sidebar({ route, onNavigate }) {
    const items = [
        ['dashboard', (0, i18n_1.t)('nav.dashboard')],
        ['instagram', (0, i18n_1.t)('nav.instagram')],
        ['facebook', (0, i18n_1.t)('nav.facebook')],
        ['tiktok', (0, i18n_1.t)('nav.tiktok')],
        ['youtube', (0, i18n_1.t)('nav.youtube')],
        ['settings', (0, i18n_1.t)('nav.settings')],
    ];
    return ((0, jsx_runtime_1.jsxs)("aside", { className: "w-64 bg-white border-r h-full p-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold mb-6", children: (0, i18n_1.t)('app.title') }), (0, jsx_runtime_1.jsx)("nav", { className: "space-y-2", children: items.map(([key, label]) => ((0, jsx_runtime_1.jsx)("button", { onClick: () => onNavigate(key), className: `w-full text-left px-3 py-2 rounded-lg ${route === key ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'}`, children: label }, key))) })] }));
}
