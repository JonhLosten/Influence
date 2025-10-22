"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Network = Network;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const api_1 = require("../lib/api");
function Network({ name }) {
    const [data, setData] = react_1.default.useState(null);
    const [error, setError] = react_1.default.useState('');
    react_1.default.useEffect(() => {
        (0, api_1.fetchSnapshot)().then(setData).catch(e => setError(String(e)));
    }, []);
    if (error)
        return (0, jsx_runtime_1.jsx)("div", { className: "text-red-600", children: error });
    if (!data)
        return (0, jsx_runtime_1.jsx)("div", { children: "\u2026" });
    const k = data.byNetwork[name];
    const posts = data.topContent.filter((p) => p.network === name);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4", children: ['views', 'impressions', 'followers', 'likes', 'comments', 'shares'].map((key) => ((0, jsx_runtime_1.jsxs)("div", { className: "bg-white border rounded-2xl p-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-sm text-gray-500", children: key }), (0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-semibold", children: (k[key] || 0).toLocaleString() })] }, key))) }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white border rounded-2xl p-4", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold mb-2", children: "Top posts" }), (0, jsx_runtime_1.jsx)("ul", { className: "space-y-2", children: posts.slice(0, 10).map((p) => ((0, jsx_runtime_1.jsxs)("li", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("span", { className: "truncate", children: p.title || p.id }), (0, jsx_runtime_1.jsxs)("span", { className: "text-sm", children: [Math.round((p.engagementRate || 0) * 100), "%"] })] }, p.id))) })] })] }));
}
