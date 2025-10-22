"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.band = band;
exports.bandColor = bandColor;
function band(value, targets) {
    if (value <= targets.bad)
        return 'bad';
    if (value >= targets.good)
        return 'good';
    return 'avg';
}
function bandColor(b) {
    return b === 'bad' ? '#ef4444' : b === 'avg' ? '#f59e0b' : '#22c55e';
}
