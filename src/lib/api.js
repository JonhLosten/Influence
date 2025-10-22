"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchSnapshot = fetchSnapshot;
async function fetchSnapshot(days = 30) {
    const res = await fetch('http://localhost:5174/api/snapshot?days=' + days);
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
