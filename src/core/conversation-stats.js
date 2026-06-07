(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    function parseDay(dateStr) {
        var p = dateStr.split('-');
        return Date.UTC(+p[0], +p[1] - 1, +p[2]);
    }

    function compute(memories) {
        if (!Array.isArray(memories) || memories.length === 0) {
            return {
                busiestDay:        null,
                busiestDayCount:   0,
                longestStreakDays:  0,
                avgMessagesPerDay: 0,
                totalDays:         0,
                perSenderStats:    []
            };
        }

        var dayCountMap = {};
        var timestampedCount = 0;

        for (var i = 0; i < memories.length; i++) {
            var m = memories[i];
            if (!m || typeof m.timestamp !== 'string' || !m.timestamp) continue;
            var day = m.timestamp.slice(0, 10);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
            dayCountMap[day] = (dayCountMap[day] || 0) + 1;
            timestampedCount++;
        }

        var sortedDays = Object.keys(dayCountMap).sort();

        var busiestDay = null;
        var busiestDayCount = 0;
        for (var d = 0; d < sortedDays.length; d++) {
            var cnt = dayCountMap[sortedDays[d]];
            if (cnt > busiestDayCount) {
                busiestDayCount = cnt;
                busiestDay = sortedDays[d];
            }
        }

        var totalDays = 0;
        if (sortedDays.length === 1) {
            totalDays = 1;
        } else if (sortedDays.length > 1) {
            totalDays = Math.round(
                (parseDay(sortedDays[sortedDays.length - 1]) - parseDay(sortedDays[0])) / 86400000
            ) + 1;
        }

        var longestStreakDays = sortedDays.length > 0 ? 1 : 0;
        var currentStreak = 1;
        for (var j = 1; j < sortedDays.length; j++) {
            var diff = Math.round(
                (parseDay(sortedDays[j]) - parseDay(sortedDays[j - 1])) / 86400000
            );
            if (diff === 1) {
                currentStreak++;
                if (currentStreak > longestStreakDays) longestStreakDays = currentStreak;
            } else {
                currentStreak = 1;
            }
        }

        var avgMessagesPerDay = totalDays > 0
            ? Math.round((timestampedCount / totalDays) * 10) / 10
            : 0;

        var senderCountMap = {};
        var senderTotal = 0;
        for (var k = 0; k < memories.length; k++) {
            var mem = memories[k];
            if (!mem || typeof mem.sender !== 'string' || !mem.sender.trim()) continue;
            var s = mem.sender;
            senderCountMap[s] = (senderCountMap[s] || 0) + 1;
            senderTotal++;
        }

        var perSenderStats = Object.keys(senderCountMap)
            .map(function (sender) {
                var count = senderCountMap[sender];
                return {
                    sender: sender,
                    count:  count,
                    pct:    senderTotal > 0 ? Math.round(count / senderTotal * 1000) / 10 : 0
                };
            })
            .sort(function (a, b) {
                if (b.count !== a.count) return b.count - a.count;
                return a.sender < b.sender ? -1 : a.sender > b.sender ? 1 : 0;
            });

        return {
            busiestDay:        busiestDay,
            busiestDayCount:   busiestDayCount,
            longestStreakDays:  longestStreakDays,
            avgMessagesPerDay: avgMessagesPerDay,
            totalDays:         totalDays,
            perSenderStats:    perSenderStats
        };
    }

    KMEngine.ConversationStats = { compute: compute };
}());
