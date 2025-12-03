var cachedneededfiles = [];

function addNeededFile() {
    var uid = Date.now().toString() + Math.floor(Math.random() * 1000).toString();

    var tbody = document.getElementsByTagName('tbody')[0];
    var newRow = document.createElement('tr');
    
    var td1 = document.createElement('td');
    var input1 = document.createElement('input');
    input1.type = 'text';
    input1.name = 'neededfile';
    input1.placeholder = './path/to/file.ext';
    td1.appendChild(input1);

    var td2 = document.createElement('td');
    var input2 = document.createElement('input');
    input2.type = 'text';
    input2.name = 'neededfilehash';
    input2.placeholder = 'SHA256 hash';
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

function openhashes() {
    window.open('https://emn178.github.io/online-tools/sha256.html?ref=deltamod_misctools', '_blank');
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
        neededFiles: []
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