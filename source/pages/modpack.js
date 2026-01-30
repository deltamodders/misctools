var cachedpatches = [];

function addPatch() {
    var uid = Date.now().toString() + Math.floor(Math.random() * 1000).toString();

    var tbody = document.getElementById('patchBody');
    var newRow = document.createElement('tr');
    
    var td0 = document.createElement('td');
    var select0 = document.createElement('select');
    select0.name = 'patchtype';
    select0.innerHTML = '<option value="xdelta">XDelta (or other supported patching file)</option><option value="override">Copy file to</option>';
    td0.appendChild(select0);

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
}

function generateXML() {
    function i(id) {
        return document.getElementById(id).value;
    }

    var str = "";

    var doc = document.implementation.createDocument("", "", null);

    cachedpatches.forEach(function (entry) {
        var fromInput = entry.from;
        var toInput = entry.to;
        if (!fromInput || !toInput) return;

        var row = fromInput.closest('tr');
        var typeSelect = row ? row.querySelector('select[name="patchtype"]') : null;
        var typeVal = typeSelect ? typeSelect.value : 'xdelta';

        var fromVal = fromInput.value.trim();
        var toVal = toInput.value.trim();
        if (!fromVal || !toVal) return;

        var patchEl = doc.createElement('patch');
        patchEl.setAttribute('type', typeVal);
        patchEl.setAttribute('patch', fromVal);
        patchEl.setAttribute('to', toVal);
        
        var patchString = new XMLSerializer().serializeToString(patchEl);
        str += patchString + "\n";
    });

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