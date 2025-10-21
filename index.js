(async() => {
    var urlparamas = new URLSearchParams(window.location.search);
    var page = urlparamas.get("page");
    if (page) {
        let pageattrresp = await fetch(`pages/${page}.pageattr`);
        let pageattr = await pageattrresp.json();
        if (pageattr.h1title) {
            document.getElementById("h1title").innerText = pageattr.h1title;
        }
        if (pageattr.h1desc) {
            document.getElementById("h1desc").innerText = pageattr.h1desc;
        }
        let pagehtmlresp = await fetch(`pages/${page}.html`);
        let pagehtml = await pagehtmlresp.text();
        document.querySelector(".main").innerHTML = pagehtml;

        let pagejs = document.createElement("script");
        pagejs.src = `pages/${page}.js`;
        document.body.appendChild(pagejs);
    }
})();

// helper for inputs with lowercase enforcement
function lowercase(inp) {
    inp.value = inp.value.toLowerCase();
    return inp;
}