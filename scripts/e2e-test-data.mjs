/**
 * Deterministic seed data for E2E regression tests.
 * Message shape matches NormalizedMemory.create() output (src/core/normalized-memory.js).
 * IDs are fixed test identifiers for stability across runs.
 * Timestamps are fixed to a 2024-06-01 base for full reproducibility.
 */

export const TEST_CONTACT_NAME = 'Alex';

const BASE_MS = new Date('2024-06-01T09:00:00.000Z').getTime();
const MIN = 60_000;

function msg(id, sender, text, offsetMin) {
    return {
        id,
        sourcePlatformId: 'txt-export',
        sourceAdapterId:  'txt-export-adapter',
        sourceNativeId:   null,
        type:             'message',
        timestamp:        new Date(BASE_MS + offsetMin * MIN).toISOString(),
        sender,
        senderRole:       sender === 'Me' ? 'self' : 'contact',
        text,
        reactions:        [],
        media:            [],
        unsupported:      false,
        provenance:       null,
        raw:              null,
        isAttachmentOnly: false,
    };
}

export const TEST_MESSAGES = [
    msg('e2e-001', 'Alex', 'Hey, did you get my note?',                  0),
    msg('e2e-002', 'Me',   'Just saw it. Appreciate it!',                 5),
    msg('e2e-003', 'Alex', 'No problem at all.',                          8),
    msg('e2e-004', 'Me',   'This means a lot, thank you.',               15),
    msg('e2e-005', 'Alex', 'Of course. That\'s what I\'m here for.',     20),
    msg('e2e-006', 'Me',   'Want to grab coffee this week?',             60),
    msg('e2e-007', 'Alex', 'Absolutely. Thursday?',                      62),
    msg('e2e-008', 'Me',   'Thursday works. See you then!',              65),
];

export const TEST_MESSAGE_COUNT = TEST_MESSAGES.length;
