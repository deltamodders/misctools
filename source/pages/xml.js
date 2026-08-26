var cachedpatches = [];

var hasCSXSupport = true;

async function addPatch() {
    var uid = Date.now().toString() + Math.floor(Math.random() * 1000).toString();

    var tbody = document.getElementById('patchBody');
    var newRow = document.createElement('tr');
    
    var td0 = document.createElement('td');
    td0.style.display = 'flex';
    td0.style.gap = '5px';
    td0.style.alignItems = 'center';
    var select0 = document.createElement('select');
    select0.name = 'patchtype';
    select0.innerHTML = `
    <option value="xdelta">Apply .xdelta</option>
    <option value="g3mpatch">Apply .g3mpatch</option>
    <option value="csx">Apply .csx</option>
    <option value="override">Override file</option>
    <option value="copy">Copy file</option>
    <option value="unrecognized" style="display: none;">Unrecognized</option>
    `;
    td0.appendChild(select0);

    select0.onchange = function() {
        var selectedType = select0.value;
        if (selectedType === 'unrecognized') {
            select0.style.backgroundColor = '#7b0000';
        }
        else {
            select0.style.backgroundColor = '';
        }
    }

    var questionMark = document.createElement('button');
    questionMark.type = 'button';
    questionMark.innerText = '?';
    questionMark.className = 'circle_button'; 
    td0.appendChild(questionMark);

    questionMark.onclick = async function() {
        var descs = {
            'xdelta': 'A .xdelta file that will be applied to the source file to produce the destination file.',
            'override': 'A file that will directly replace the source file without any patching. The source file will be ignored.',
            'copy': 'A file that will be copied to the destination path.',
            'g3mpatch': 'A .g3mpatch file that will be applied to the source file to produce the destination file.',
            'csx': 'An UTMT script which will be executed to get the resulting data.win file.'
        };
        var selectedType = select0.value;
        await smalltalk.alert('Patch type: <code>' + selectedType + '</code>', descs[selectedType] || 'No description available for this patch type.');
    };

    var td1 = document.createElement('td');
    var input1 = document.createElement('input');
    input1.type = 'text';
    input1.name = 'patchfrom';
    input1.placeholder = './path/to/patch.xdelta';
    td1.appendChild(input1);

    var td2 = document.createElement('td');
    var input2 = document.createElement('input');
    input2.type = 'text';
    input2.name = 'patchto';
    input2.placeholder = './path/to/dest.win';
    td2.appendChild(input2);

    var td3 = document.createElement('td');
    var removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.style.width = '100%';
    removeButton.style.padding = '5px';
    removeButton.innerText = 'Remove';
    removeButton.onclick = function() {
        tbody.removeChild(newRow);
        cachedpatches = cachedpatches.filter(item => item.uid !== uid);
    };
    td3.appendChild(removeButton);

    cachedpatches.push({from: input1, to: input2, uid: uid});

    newRow.appendChild(td0);
    newRow.appendChild(td1);
    newRow.appendChild(td2);
    newRow.appendChild(td3);
    tbody.appendChild(newRow);

    newRow.style.animation = 'objFadeIn 0.5s ease-out forwards';
}


async function generateXML() {
    function i(id) {
        return document.getElementById(id).value;
    }

    var str = "";

    var doc = document.implementation.createDocument("", "", null);

    if (cachedpatches.length == 0) {
        await smalltalk.alert("No patches added", "Please add at least one patch before generating the XML.");
        return;
    }

    for (var idx = 0; idx < cachedpatches.length; idx++) {
        var entry = cachedpatches[idx];
        var fromInput = entry.from;
        var toInput = entry.to;
        if (!fromInput || !toInput) return;

        var row = fromInput.closest('tr');
        var typeSelect = row ? row.querySelector('select[name="patchtype"]') : null;
        var typeVal = typeSelect ? typeSelect.value : 'xdelta';

        if (typeVal == 'unrecognized') {
            await smalltalk.alert("Unrecognized patch type", "One of the patches has an unrecognized type. Please correct it before generating the XML.");
            return;
        }

        var fromVal = fromInput.value.trim();
        var toVal = toInput.value.trim();
        if (!fromVal || !toVal) return;

        var patchEl = doc.createElement('patch');
        patchEl.setAttribute('type', typeVal);
        patchEl.setAttribute('patch', fromVal);
        patchEl.setAttribute('to', toVal);
        
        var patchString = new XMLSerializer().serializeToString(patchEl);
        str += patchString + "\n";
    }

    var blob = new Blob([str], { type: 'application/xml' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'modding.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function loadXML() {
    var xml = await new Promise((resolve) => {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xml';
        input.style.display = 'none';
        document.body.appendChild(input);
        input.onchange = function() {
            var file = input.files[0];
            var reader = new FileReader();
            reader.onload = function(e) {
                xmlText = e.target.result;
                resolve(xmlText);
            };
            reader.readAsText(file);
        };
        input.click();
    });

    function getAttr(tagText, attrName) {
        var match = tagText.match(new RegExp(attrName + '\\s*=\\s*["\']([^"\']*)["\']', 'i'));
        return match ? match[1] : '';
    }

    var tbody = document.getElementById('patchBody');
    if (tbody) tbody.innerHTML = '';
    cachedpatches = [];

    var patchRegex = /<patch\b([^>]*)\/?>/gi;
    var match;
    while ((match = patchRegex.exec(xml)) !== null) {
        var attrs = match[1] || '';
        var typeVal = getAttr(attrs, 'type') || 'xdelta';
        var fromVal = getAttr(attrs, 'patch');
        var toVal = getAttr(attrs, 'to');

        await addPatch();

        var entry = cachedpatches[cachedpatches.length - 1];
        if (!entry) continue;

        var row = entry.from ? entry.from.closest('tr') : null;
        var typeSelect = row ? row.querySelector('select[name="patchtype"]') : null;
        if (['xdelta', 'override', 'copy', 'g3mpatch', 'csx'].indexOf(typeVal) === -1) {
            typeVal = 'unrecognized';
            typeSelect.style.backgroundColor = '#7b0000';
        }
        if (typeVal == 'csx' && !hasCSXSupport) {
            typeVal = 'unrecognized';
            typeSelect.style.backgroundColor = '#7b0000';
            await smalltalk.alert("CSX support not enabled", "This XML contains a patch of type 'csx', but CSX support is not enabled in this session.");
        }
        if (typeSelect) typeSelect.value = typeVal;
        entry.from.value = fromVal;
        entry.to.value = toVal;
    }

    
}