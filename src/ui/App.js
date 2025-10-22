"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = App;
const jsx_runtime_1 = require("react/jsx-runtime");
const Sidebar_1 = require("./Sidebar");
const Dashboard_1 = require("../views/Dashboard");
const Network_1 = require("../views/Network");
const Settings_1 = require("../views/Settings");
const react_1 = __importDefault(require("react"));
function App() {
    const [route, setRoute] = react_1.default.useState('dashboard');
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex h-screen", children: [(0, jsx_runtime_1.jsx)(Sidebar_1.Sidebar, { route: route, onNavigate: setRoute }), (0, jsx_runtime_1.jsxs)("main", { className: "flex-1 overflow-auto p-4", children: [route === 'dashboard' && (0, jsx_runtime_1.jsx)(Dashboard_1.Dashboard, {}), route === 'instagram' && (0, jsx_runtime_1.jsx)(Network_1.Network, { name: "instagram" }), route === 'facebook' && (0, jsx_runtime_1.jsx)(Network_1.Network, { name: "facebook" }), route === 'tiktok' && (0, jsx_runtime_1.jsx)(Network_1.Network, { name: "tiktok" }), route === 'youtube' && (0, jsx_runtime_1.jsx)(Network_1.Network, { name: "youtube" }), route === 'settings' && (0, jsx_runtime_1.jsx)(Settings_1.Settings, {})] })] }));
}
