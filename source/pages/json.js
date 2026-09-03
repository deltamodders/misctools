var cachedneededfiles = [];

function poc(func, ...args) {
    return new Promise((resolve) => {
        func(...args).then(() => {
            resolve(true);
        }).catch(() => {
            resolve(false);
        });
    });
}

async function addNeededFile(fillName = '', fillHash = '', askQuest = true) {
    var uid = Date.now().toString() + Math.floor(Math.random() * 1000).toString();

    if (askQuest) {
        var importFile = await htmlAlertRaw(
            'Question',
            'Do you want to import a file to fill in its path and hash?',
            [
                {
                    text: 'Yes',
                    resolveWith: 'y'
                },
                {
                    text: 'No',
                    resolveWith: 'n'
                }
            ]
        );
        if (importFile == 'y') {
            console.log('User chose to import a file. Opening file dialog...');
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

                    await htmlAlertRaw(
                        'Success',
                        'File imported successfully!<br>Path: ' + fillName + '<br>SHA256 Hash: ' + fillHash,
                        [
                            {
                                text: 'OK',
                                resolveWith: true
                            }
                        ]
                    );
                }
            };
            fileInput.click();
            return;
        }
        else {
            console.log('User chose not to import a file. Proceeding with empty path and hash.');
            fillName = '';
            fillHash = '';
            addNeededFile(fillName, fillHash, false);
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

    newRow.style.animation = 'objFadeIn 0.5s ease-out forwards';
}

async function fillInFromObject(obj, toml) {
    function setValue(id, value) {
        var el = document.getElementById(id);
        if (el) el.value = value ?? '';
    }

    function setCheckboxesByValue(name, values) {
        var set = new Set(Array.isArray(values) ? values : []);
        document.querySelectorAll(`input[name="${name}"]`).forEach(cb => {
            cb.checked = set.has(cb.dataset.value);
        });
    }

    function splitPackageID(packageID) {
        var parts = String(packageID || '').split('.');
        return [parts[0] || '', parts[1] || '', parts[2] || ''];
    }

    var metadata = obj && obj.metadata ? obj.metadata : {};
    var color = toml ? metadata.color : obj.color;
    if (!color && metadata.color) color = metadata.color;

    setValue('metadata.name', metadata.name);
    setValue('metadata.version', metadata.version);
    setValue('metadata.description', metadata.description);
    setValue('metadata.authors', Array.isArray(metadata.author) ? metadata.author.join(', ') : (metadata.author ?? ''));
    setValue('metadata.url', metadata.url);
    setValue('metadata.game', metadata.game || 'toby.deltarune');

    var packageParts = splitPackageID(metadata.packageID);
    setValue('metadata.packageID.1', packageParts[0]);
    setValue('metadata.packageID.2', packageParts[1]);
    setValue('metadata.packageID.3', packageParts[2]);

    if (color && typeof color === 'object') {
        var hex = `#${((1 << 24) + ((color.r || 0) << 16) + ((color.g || 0) << 8) + (color.b || 0)).toString(16).slice(1)}`;
        setValue('metadata.color', hex);
    }

    setCheckboxesByValue('metadata.tags', metadata.tags);
    setValue('deltaruneTargetVersion', obj.deltaruneTargetVersion);

    toggleDhubVER();
    
    var tbody = document.getElementsByTagName('tbody')[0];
    if (tbody) tbody.innerHTML = '';
    cachedneededfiles = [];

    var neededFiles = Array.isArray(obj.neededFiles) ? obj.neededFiles : [];
    for (var i = 0; i < neededFiles.length; i++) {
        var entry = neededFiles[i] || {};
        await addNeededFile(entry.file || '', entry.checksum || '', false);
    }
}

async function importMeta() {
    var format = await htmlAlertRaw(
        'Question',
        'Do you want to import a <code>meta.json</code> or a <code>meta.toml</code> file?',
        [
            {
                text: 'JSON',
                resolveWith: true
            },
            {
                text: 'TOML',
                resolveWith: false
            }
        ]
    );

    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = format ? '.json' : '.toml';
    fileInput.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                if (format) {
                    var jsonData = JSON.parse(content);
                    fillInFromObject(jsonData, false);
                } else {
                    var tomlData = window.TOML.parse(content);
                    fillInFromObject(tomlData, true);
                }
            };
            reader.readAsText(file);
        }
    };
    fileInput.click();
}

function getPredominantColor(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const width = canvas.width = 256;
    const height = canvas.height = 256;

    ctx.drawImage(img, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const colorCount = {};
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const key = `${r},${g},${b}`;
        colorCount[key] = (colorCount[key] || 0) + 1;
    }

    let top = null;
    let second = null;
    for (const [key, count] of Object.entries(colorCount)) {
        if (!top || count > top.count) {
            second = top;
            top = { key, count };
        } else if (!second || count > second.count) {
            second = { key, count };
        }
    }

    const parseKey = (k) => {
        const [r, g, b] = k.split(',').map(Number);
        return { r, g, b };
    };

    const isBlackOrWhite = ({ r, g, b }, tol = 16) => {
        const isBlack = r <= tol && g <= tol && b <= tol;
        const isWhite = r >= 255 - tol && g >= 255 - tol && b >= 255 - tol;
        return isBlack || isWhite;
    };

    let dominantColor = top ? parseKey(top.key) : { r: 0, g: 0, b: 0 };
    if (top && isBlackOrWhite(dominantColor) && second) {
        dominantColor = parseKey(second.key);
    }

    return dominantColor;
}

function calculateDCI() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const img = new Image();
            img.onload = function() {
                const color = getPredominantColor(img);
                const hexColor = `#${((1 << 24) + (color.r << 16) + (color.g << 8) + color.b).toString(16).slice(1)}`;
                document.getElementById('metadata.color').value = hexColor;
            };
            img.src = URL.createObjectURL(file);
        }
    };
    fileInput.click();
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


async function generateJSON(toml = false) {
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
        i('metadata.authors').trim().length === 0 ||
        i('metadata.game').trim() == 'null'
    ) {
        await htmlAlertRaw('Alert', 'Please fill in all required fields.', [
            {
                text: 'OK',
                resolveWith: true
            }
        ]);
        return;
    }

    if (i('metadata.packageID.1').trim().length === 0 ||
        i('metadata.packageID.2').trim().length === 0 ||
        i('metadata.packageID.3').trim().length === 0) {
        await htmlAlertRaw('Alert', 'Please fill in all parts of the Package ID.', [
            {
                text: 'OK',
                resolveWith: true
            }
        ]);
        return;
    }

    var compiledJSON = {
        metadata: {
            name: i('metadata.name'),
            version: i('metadata.version'),
            description: i('metadata.description'),
            ai: i('metadata.ai') || 'no',
            author: i('metadata.authors').split(',').map(s => s.trim()).filter(s => s.length > 0),
            url: i('metadata.url'),
            color: toml ? "" : { r: colorValue.r, g: colorValue.g, b: colorValue.b },
            tags: document.querySelectorAll('input[name="metadata.tags"]:checked').length > 0 ? Array.from(document.querySelectorAll('input[name="metadata.tags"]:checked')).map(cb => cb.dataset.value) : undefined,
            game: i('metadata.game') || 'toby.deltarune',
            packageID: i('metadata.packageID.1') + '.' + i('metadata.packageID.2') + '.' + i('metadata.packageID.3')
        },
        color: toml ? { r: colorValue.r, g: colorValue.g, b: colorValue.b } : "",
        deltaruneTargetVersion: i('deltaruneTargetVersion'),
        neededFiles: [],
        exporter: {
            tool: 'MiscTools'
        }
    };

    if (toml) {
        delete compiledJSON.metadata.color;
    }
    else {
        delete compiledJSON.color;
    }

    cachedneededfiles.forEach(item => {
        var path = item.pathInput.value.trim();
        var hash = item.hashInput.value.trim();
        if (path.length > 0) {
            compiledJSON.neededFiles.push({file: path, checksum: hash});
        }
    });

    if (toml) {
        var tomlOutput = window.TOML.stringify(compiledJSON);

        var blob = new Blob([tomlOutput], { type: 'application/toml' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'meta.toml';
        a.click();
        URL.revokeObjectURL(url);
    } else {
        var jsonOutput = JSON.stringify(compiledJSON, null, 4);

        var blob = new Blob([jsonOutput], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'meta.json';
        a.click();
        URL.revokeObjectURL(url);
    }
}

function toggleDhubVER() {
    var gameSelect = document.getElementById('metadata.game');
    var dhubVerDiv = document.querySelector('.deltahubTargetVer');
    var dhubIncomp = document.querySelector('.deltahubIncompatible');
    /**if (gameSelect.value !== null) {
        dhubVerDiv.style.display = 'block';
        dhubIncomp.style.display = 'none';
        
    } else {
        dhubVerDiv.style.display = 'none';
        dhubIncomp.style.display = 'block';
        document.getElementById('deltaruneTargetVersion').value = '';
    }*/
    // Removed incompatible message for now, as G3M supports all games MiscTools does. It will be re-added if needed in the future.
    dhubVerDiv.style.display = 'block';
    dhubIncomp.style.display = 'none';
}