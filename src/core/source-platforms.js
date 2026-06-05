(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    var SOURCE_PLATFORMS = [
        // ── Supported ────────────────────────────────────────────────────────────
        {
            id: 'imessage',
            label: 'iMessage / Mac Messages',
            status: 'supported',
            importModes: ['chat-db-sql'],
            fidelityLevel: 'high',
            publicClaimStatus: false,
            notes: 'Requires chat.db from ~/Library/Messages. SQL.js parses in-browser.'
        },
        {
            id: 'txt-export',
            label: 'Text Export (.txt)',
            status: 'supported',
            importModes: ['txt-file'],
            fidelityLevel: 'medium',
            publicClaimStatus: false,
            notes: 'Pipe-delimited text export. Reactions inferred from message text pattern.'
        },
        {
            id: 'manual',
            label: 'Manual Entry',
            status: 'supported',
            importModes: ['manual-entry'],
            fidelityLevel: 'manual',
            publicClaimStatus: false,
            notes: 'User-authored messages. Timestamp and sender supplied by the user.'
        },
        // ── Stubs ────────────────────────────────────────────────────────────────
        {
            id: 'whatsapp',
            label: 'WhatsApp',
            status: 'supported',
            importModes: ['txt-export-chat'],
            fidelityLevel: 'medium',
            publicClaimStatus: false,
            notes: 'WhatsApp .txt chat export (bracket and hyphen formats). Engine adapter whatsapp-txt-v1 exists. UI wiring pending.'
        },
        {
            id: 'android-sms',
            label: 'Android SMS (XML Backup)',
            status: 'supported',
            importModes: ['xml-backup'],
            fidelityLevel: 'medium',
            publicClaimStatus: false,
            notes: 'SMS Backup & Restore XML format. Engine adapter android-sms-xml-v1 implemented (Package 3M). UI wiring pending a later package.'
        },
        {
            id: 'instagram-dm',
            label: 'Instagram Direct Messages',
            status: 'stub',
            importModes: ['json-export'],
            fidelityLevel: 'medium',
            publicClaimStatus: false,
            notes: 'Instagram data export (JSON). Adapter not yet implemented.'
        },
        {
            id: 'facebook-messenger',
            label: 'Facebook Messenger',
            status: 'stub',
            importModes: ['json-export'],
            fidelityLevel: 'medium',
            publicClaimStatus: false,
            notes: 'Facebook data export (JSON). Adapter not yet implemented.'
        },
        {
            id: 'telegram',
            label: 'Telegram',
            status: 'stub',
            importModes: ['json-export'],
            fidelityLevel: 'medium',
            publicClaimStatus: false,
            notes: 'Telegram desktop JSON export. Adapter not yet implemented.'
        },
        // ── Deferred ─────────────────────────────────────────────────────────────
        {
            id: 'screenshot-image',
            label: 'Screenshot / Image',
            status: 'deferred',
            importModes: ['ocr-image'],
            fidelityLevel: 'low',
            publicClaimStatus: false,
            notes: 'OCR-based text extraction. Requires server-side pipeline. Deferred.'
        },
        {
            id: 'audio-transcript',
            label: 'Audio Transcript',
            status: 'deferred',
            importModes: ['transcription'],
            fidelityLevel: 'low',
            publicClaimStatus: false,
            notes: 'Audio-to-text transcription. Requires server-side pipeline. Deferred.'
        },
        {
            id: 'video-transcript',
            label: 'Video Transcript',
            status: 'deferred',
            importModes: ['transcription'],
            fidelityLevel: 'low',
            publicClaimStatus: false,
            notes: 'Video-to-text transcription. Requires server-side pipeline. Deferred.'
        }
    ];

    KMEngine.SOURCE_PLATFORMS = SOURCE_PLATFORMS;

    KMEngine.getSourcePlatform = function (id) {
        for (var i = 0; i < SOURCE_PLATFORMS.length; i++) {
            if (SOURCE_PLATFORMS[i].id === id) return SOURCE_PLATFORMS[i];
        }
        return null;
    };
}());
