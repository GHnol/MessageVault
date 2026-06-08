(function () {
  'use strict';

  const ZERO_STATE = {
    avgResponseTimeMs: 0,
    fastestResponder: null,
    perSenderStats: [],
  };

  function compute(memories) {
    if (!Array.isArray(memories) || memories.length === 0) return ZERO_STATE;

    const valid = [];
    for (const m of memories) {
      if (!m || m.senderRole === 'system') continue;
      if (!m.timestamp) continue;
      const t = new Date(m.timestamp).getTime();
      if (isNaN(t)) continue;
      valid.push({ sender: m.sender || '', t });
    }

    if (valid.length < 2) return ZERO_STATE;

    valid.sort(function (a, b) { return a.t - b.t; });

    const senderDeltas = Object.create(null);
    const allDeltas = [];

    for (let i = 1; i < valid.length; i++) {
      const prev = valid[i - 1];
      const curr = valid[i];
      if (prev.sender === curr.sender) continue;
      const delta = curr.t - prev.t;
      if (delta < 0) continue;
      if (!senderDeltas[curr.sender]) senderDeltas[curr.sender] = [];
      senderDeltas[curr.sender].push(delta);
      allDeltas.push(delta);
    }

    if (allDeltas.length === 0) return ZERO_STATE;

    const avgResponseTimeMs = Math.round(
      allDeltas.reduce(function (s, d) { return s + d; }, 0) / allDeltas.length
    );

    const perSenderStats = Object.keys(senderDeltas)
      .map(function (sender) {
        const deltas = senderDeltas[sender];
        const avg = Math.round(deltas.reduce(function (s, d) { return s + d; }, 0) / deltas.length);
        return { sender: sender, avgResponseTimeMs: avg, responseCount: deltas.length };
      })
      .sort(function (a, b) {
        if (a.avgResponseTimeMs !== b.avgResponseTimeMs) return a.avgResponseTimeMs - b.avgResponseTimeMs;
        return a.sender < b.sender ? -1 : a.sender > b.sender ? 1 : 0;
      });

    const fastestResponder = perSenderStats.length > 0 ? perSenderStats[0] : null;

    return { avgResponseTimeMs, fastestResponder, perSenderStats };
  }

  window.KMEngine = window.KMEngine || {};
  window.KMEngine.ResponseTimeAnalysis = { compute };
})();
