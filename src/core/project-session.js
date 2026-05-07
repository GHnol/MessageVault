(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    var SESSION_VERSION = '1';

    function generateSessionId() {
        return 'sess-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
    }

    KMEngine.ProjectSession = {
        VERSION: SESSION_VERSION,

        create: function (opts) {
            var now = new Date().toISOString();
            return {
                id:                opts.id                || generateSessionId(),
                version:           SESSION_VERSION,
                createdAt:         opts.createdAt         || now,
                updatedAt:         now,
                sourceImports:     opts.sourceImports     || [],
                memories:          opts.memories          || [],
                selectedMemoryIds: opts.selectedMemoryIds || [],
                keepsakeGroups:    opts.keepsakeGroups    || [],
                productDrafts:     opts.productDrafts     || []
            };
        },

        touch: function (session) {
            session.updatedAt = new Date().toISOString();
            return session;
        },

        validate: function (obj) {
            if (!obj || typeof obj !== 'object')     return false;
            if (typeof obj.id !== 'string')          return false;
            if (!Array.isArray(obj.memories))        return false;
            if (!Array.isArray(obj.selectedMemoryIds)) return false;
            if (!Array.isArray(obj.keepsakeGroups))  return false;
            return true;
        }
    };
}());
