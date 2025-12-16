var cachedneededfiles = [];

function addNeededFile(fillName = '', fillHash = '', askQuest = true) {
    var uid = Date.now().toString() + Math.floor(Math.random() * 1000).toString();

    if (askQuest) {
        var importFile = window.confirm('Do you want to import a file to fill in its path and hash? Click "Cancel" to add an empty entry.');
        if (importFile) {
            var fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.onchange = async function(event) {
                var file = event.target.files[0];
                if (file) {
                    var arrayBuffer = await file.arrayBuffer();
                    var hash = await sha256(arrayBuffer);

                    fillName = "./" + file.name;
                    fillHash = hash;

                    addNeededFile(fillName, fillHash, false);

                    window.alert('File imported successfully!\n\nNote that the path generated supposes the file will be in the root of the mod package.');
                }
            };
            fileInput.click();
            return;
        }
    }

    var tbody = document.getElementsByTagName('tbody')[0];
    var newRow = document.createElement('tr');
    
    var td1 = document.createElement('td');
    var input1 = document.createElement('input');
    input1.type = 'text';
    input1.name = 'neededfile';
    input1.placeholder = './path/to/file.ext';
    input1.value = fillName;
    td1.appendChild(input1);

    var td2 = document.createElement('td');
    var input2 = document.createElement('input');
    input2.type = 'text';
    input2.name = 'neededfilehash';
    input2.placeholder = 'SHA256 hash';
    input2.value = fillHash;
    td2.appendChild(input2);

    var td3 = document.createElement('td');
    var removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.style.width = '100%';
    removeButton.style.padding = '5px';
    removeButton.innerText = 'Remove';
    removeButton.onclick = function() {
        tbody.removeChild(newRow);
        cachedneededfiles = cachedneededfiles.filter(item => item.uid !== uid);
    };
    td3.appendChild(removeButton);

    cachedneededfiles.push({pathInput: input1, hashInput: input2, uid: uid});

    newRow.appendChild(td1);
    newRow.appendChild(td2);
    newRow.appendChild(td3);
    tbody.appendChild(newRow);
}

function metaColorBlack() {
    document.getElementById('metadata.color').value = '#000000';
}

// Source - https://stackoverflow.com/a
// Posted by Vitaly Zdanevich, modified by community. See post 'Timeline' for change history
// Edited partially to support file hashing
// Retrieved 2025-12-16, License - CC BY-SA 4.0

async function sha256(msgBuffer) {          
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));        
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}


function generateJSON() {
    function i(id) {
        return document.getElementById(id).value;
    }

    var colorValue = document.getElementById('metadata.color').value;
    function hexToRgb(hex) {
        hex = (hex || '').replace(/^#/, '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        if (!/^[0-9a-fA-F]{6}$/.test(hex)) return { r: 0, g: 0, b: 0 };
        const intVal = parseInt(hex, 16);
        return {
            r: (intVal >> 16) & 255,
            g: (intVal >> 8) & 255,
            b: intVal & 255
        };
    }

    colorValue = hexToRgb(colorValue);

    if (
        i('metadata.name').trim().length === 0 ||
        i('metadata.version').trim().length === 0 ||
        i('metadata.description').trim().length === 0 ||
        i('metadata.authors').trim().length === 0
    ) {
        alert('Please fill in all required metadata fields (Name, Version, Description, Authors).');
        return;
    }

    if (i('metadata.packageID.1').trim().length === 0 ||
        i('metadata.packageID.2').trim().length === 0 ||
        i('metadata.packageID.3').trim().length === 0) {
        alert('Please fill in all parts of the Package ID.');
        return;
    }

    var compiledJSON = {
        metadata: {
            name: i('metadata.name'),
            version: i('metadata.version'),
            description: i('metadata.description'),
            author: i('metadata.authors').split(',').map(s => s.trim()).filter(s => s.length > 0),
            url: i('metadata.url'),
            color: { r: colorValue.r, g: colorValue.g, b: colorValue.b },
            tags: document.querySelectorAll('input[name="metadata.tags"]:checked').length > 0 ? Array.from(document.querySelectorAll('input[name="metadata.tags"]:checked')).map(cb => cb.dataset.value) : undefined,
            demoMod: (i('metadata.demoMod') == 'true' ? true : false),
            packageID: i('metadata.packageID.1') + '.' + i('metadata.packageID.2') + '.' + i('metadata.packageID.3')
        },
        deltaruneTargetVersion: i('deltaruneTargetVersion'),
        neededFiles: [],
        exporter: {
            tool: 'MiscTools'
        }
    };

    cachedneededfiles.forEach(item => {
        var path = item.pathInput.value.trim();
        var hash = item.hashInput.value.trim();
        if (path.length > 0) {
            compiledJSON.neededFiles.push({file: path, checksum: hash});
        }
    });

    var jsonOutput = JSON.stringify(compiledJSON, null, 4);
    
    var blob = new Blob([jsonOutput], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'meta.json';
    a.click();
    URL.revokeObjectURL(url);
}