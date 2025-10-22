"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dashboard = Dashboard;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const api_1 = require("../lib/api");
const scoring_1 = require("../lib/scoring");
const i18n_1 = require("../i18n");
const recharts_1 = require("recharts");
function Dashboard() {
    const [data, setData] = react_1.default.useState(null);
    const [error, setError] = react_1.default.useState('');
    react_1.default.useEffect(() => {
        (0, api_1.fetchSnapshot)().then(setData).catch(e => setError(String(e)));
    }, []);
    if (error)
        return (0, jsx_runtime_1.jsx)("div", { className: "text-red-600", children: error });
    if (!data)
        return (0, jsx_runtime_1.jsx)("div", { children: (0, i18n_1.t)('loading') });
    const { totals, topContent, byNetwork } = data;
    const engagementPct = Math.round(((totals.likes || 0) + (totals.comments || 0) + (totals.shares || 0)) * 100 / ((totals.impressions || 1)));
    const kpis = [
        { label: (0, i18n_1.t)('kpi.totalViews'), value: totals.views, targets: { bad: 1000, good: 10000 } },
        { label: (0, i18n_1.t)('kpi.impressions'), value: totals.impressions, targets: { bad: 2000, good: 15000 } },
        { label: (0, i18n_1.t)('kpi.followers'), value: totals.followers, targets: { bad: 100, good: 5000 } },
        { label: (0, i18n_1.t)('kpi.engagement'), value: engagementPct, targets: { bad: 1, good: 5 } },
    ];
    return ((0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: kpis.map((k) => {
                    const b = (0, scoring_1.band)(k.value, k.targets);
                    return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-white border rounded-2xl p-4 shadow-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-sm text-gray-500", children: k.label }), (0, jsx_runtime_1.jsx)("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: (0, scoring_1.bandColor)(b) } })] }), (0, jsx_runtime_1.jsx)("div", { className: "text-3xl font-semibold", children: k.value?.toLocaleString?.() ?? k.value })] }, k.label));
                }) }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-white border rounded-2xl p-4", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold mb-2", children: (0, i18n_1.t)('topContent') }), (0, jsx_runtime_1.jsx)("ul", { className: "space-y-2 max-h-72 overflow-auto", children: topContent.map((p) => ((0, jsx_runtime_1.jsxs)("li", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("span", { className: "truncate", children: [p.network.toUpperCase(), " \u00B7 ", p.title || p.id] }), (0, jsx_runtime_1.jsxs)("span", { className: "text-sm", children: [Math.round((p.engagementRate || 0) * 100), "%"] })] }, p.id))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white border rounded-2xl p-4", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold mb-2", children: (0, i18n_1.t)('trendViews') }), (0, jsx_runtime_1.jsx)("div", { style: { width: '100%', height: 240 }, children: (0, jsx_runtime_1.jsx)(recharts_1.ResponsiveContainer, { children: (0, jsx_runtime_1.jsxs)(recharts_1.LineChart, { data: Object.entries(byNetwork).map(([n, k]) => ({ name: n, views: k.views })), children: [(0, jsx_runtime_1.jsx)(recharts_1.CartesianGrid, { strokeDasharray: "3 3" }), (0, jsx_runtime_1.jsx)(recharts_1.XAxis, { dataKey: "name" }), (0, jsx_runtime_1.jsx)(recharts_1.YAxis, {}), (0, jsx_runtime_1.jsx)(recharts_1.Tooltip, {}), (0, jsx_runtime_1.jsx)(recharts_1.Line, { type: "monotone", dataKey: "views" })] }) }) })] })] })] }));
}
