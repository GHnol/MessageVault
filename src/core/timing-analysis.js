(function () {
  'use strict';

  const ZERO_STATE = {
    peakHour: null,
    peakHourCount: 0,
    peakDayOfWeek: null,
    peakDayOfWeekCount: 0,
    hourlyDistribution: new Array(24).fill(0),
    dailyDistribution: new Array(7).fill(0),
  };

  function compute(memories) {
    if (!Array.isArray(memories) || memories.length === 0) return ZERO_STATE;

    const hourly = new Array(24).fill(0);
    const daily = new Array(7).fill(0);
    let hasValid = false;

    for (const m of memories) {
      if (!m || !m.timestamp) continue;
      const d = new Date(m.timestamp);
      if (isNaN(d.getTime())) continue;
      hourly[d.getUTCHours()]++;
      daily[d.getUTCDay()]++;
      hasValid = true;
    }

    if (!hasValid) return ZERO_STATE;

    let peakHour = null, peakHourCount = 0;
    for (let i = 0; i < 24; i++) {
      if (hourly[i] > peakHourCount) { peakHourCount = hourly[i]; peakHour = i; }
    }

    let peakDayOfWeek = null, peakDayOfWeekCount = 0;
    for (let i = 0; i < 7; i++) {
      if (daily[i] > peakDayOfWeekCount) { peakDayOfWeekCount = daily[i]; peakDayOfWeek = i; }
    }

    return {
      peakHour,
      peakHourCount,
      peakDayOfWeek,
      peakDayOfWeekCount,
      hourlyDistribution: hourly,
      dailyDistribution: daily,
    };
  }

  window.KMEngine = window.KMEngine || {};
  window.KMEngine.TimingAnalysis = { compute };
})();
