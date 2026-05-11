(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    // Trigger a browser download of the serialized project snapshot.
    function save(data, contactName) {
        var json = JSON.stringify(data, null, 2);
        var blob = new Blob([json], { type: 'application/json' });
        var url  = URL.createObjectURL(blob);
        var a    = document.createElement('a');
        a.href   = url;
        var safeName = (contactName || 'project')
            .replace(/[^a-zA-Z0-9]+/g, '_')
            .replace(/^_|_$/g, '')
            .toLowerCase() || 'project';
        a.download = 'keepmees_' + safeName + '.keepmees.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    // Read a File object and pass it through ProjectPersistence.deserialize.
    // Returns a Promise resolving to { success, data, error }.
    function load(file) {
        return new Promise(function (resolve) {
            if (!file) {
                resolve({ success: false, data: null, error: 'No file provided' });
                return;
            }
            var reader = new FileReader();
            reader.onload = function (e) {
                var PP = window.KMEngine && window.KMEngine.ProjectPersistence;
                if (!PP) {
                    resolve({ success: false, data: null, error: 'ProjectPersistence not loaded' });
                    return;
                }
                resolve(PP.deserialize(e.target.result));
            };
            reader.onerror = function () {
                resolve({ success: false, data: null, error: 'File could not be read' });
            };
            reader.readAsText(file);
        });
    }

    KMEngine.ProjectFileIO = {
        save: save,
        load: load
    };
}());
