"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const ayrshare_js_1 = require("./ayrshare.js");
const normalize_js_1 = require("./normalize.js");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const networks = ['instagram', 'facebook', 'tiktok', 'youtube'];
app.get('/api/snapshot', async (req, res) => {
    try {
        const days = +(req.query.days || 30);
        const byNetwork = {};
        const topContent = [];
        for (const n of networks) {
            const [profile, posts] = await Promise.all([
                (0, ayrshare_js_1.getProfileAnalytics)(n, days),
                (0, ayrshare_js_1.getPostsAnalytics)(n, days)
            ]);
            byNetwork[n] = (0, normalize_js_1.normalizeProfile)(n, profile);
            topContent.push(...(0, normalize_js_1.normalizePosts)(n, posts));
        }
        topContent.sort((a, b) => (b.engagementRate || 0) - (a.engagementRate || 0));
        const totals = Object.values(byNetwork).reduce((acc, kpi) => {
            for (const key of ['followers', 'impressions', 'views', 'likes', 'comments', 'shares']) {
                acc[key] = (acc[key] || 0) + (kpi[key] || 0);
            }
            return acc;
        }, { period: { from: '', to: '' } });
        res.json({ byNetwork, totals, topContent: topContent.slice(0, 20) });
    }
    catch (e) {
        res.status(500).send(String(e?.message || e));
    }
});
const port = 5174;
app.listen(port, () => console.log('API local on http://localhost:' + port));
