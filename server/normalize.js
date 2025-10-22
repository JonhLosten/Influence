"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeProfile = normalizeProfile;
exports.normalizePosts = normalizePosts;
function normalizeProfile(network, raw) {
    const followers = raw.followers ?? raw.subscribers ?? 0;
    const impressions = raw.impressions ?? raw.reach ?? raw.views ?? 0;
    const likes = raw.likes ?? 0;
    const comments = raw.comments ?? 0;
    const shares = raw.shares ?? 0;
    const views = raw.views ?? impressions ?? 0;
    const engagementRate = impressions ? +(((likes + comments + shares) / impressions).toFixed(4)) : undefined;
    return { followers, impressions, views, likes, comments, shares, engagementRate, period: raw.period ?? { from: '', to: '' } };
}
function normalizePosts(network, raw) {
    return raw.map(r => ({
        id: r.id, network,
        title: r.title || r.caption,
        url: r.url,
        publishedAt: r.publishedAt || r.time,
        views: r.views ?? r.impressions ?? 0,
        impressions: r.impressions,
        likes: r.likes ?? 0,
        comments: r.comments ?? 0,
        shares: r.shares ?? 0,
        engagementRate: r.impressions ? (((r.likes || 0) + (r.comments || 0) + (r.shares || 0)) / r.impressions) : undefined,
        thumbnail: r.thumbnail,
    }));
}
