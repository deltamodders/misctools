const fs = require('fs');
const chalk = require('chalk');
const express = require('express');
//aspa
const { execSync } = require('child_process');

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
    }

    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = `${src}/${entry.name}`;
        const destPath = `${dest}/${entry.name}`;

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
    
console.clear();
console.log(chalk.blue('MiscTools Builder') + "\nAuthor: GhinoRhino");
console.log('[' + '-'.repeat(process.stdout.columns - 2) + ']');

if (fs.existsSync('./dist')) {
    fs.rmSync('./dist', { recursive: true, force: true });
}

fs.mkdirSync('./dist');

(async () => {
    const pagesDir = './source/pages/';
    const pages = fs.readdirSync(pagesDir).filter(file => file.endsWith('.pageattr'));

    for (const pageFile of pages) {
        const baseHTML = fs.readFileSync('./source/base/base.html', 'utf-8');

        const pageattr = JSON.parse(fs.readFileSync(pagesDir + pageFile, 'utf-8'));
        const pageContent = fs.readFileSync(pagesDir + pageFile.replace('.pageattr','.html'), 'utf-8');
        const pageScript = fs.existsSync(pagesDir + pageFile.replace('.pageattr','.js')) ? fs.readFileSync(pagesDir + pageFile.replace('.pageattr','.js'), 'utf-8') : '';

        var buildNote = 'Generated at compile-time by MiscTools Builder on ' + new Date().toISOString();
        const finalHTML = baseHTML
            .replaceAll('$H1TITLE', pageattr.h1title)
            .replaceAll('$H1DESC', pageattr.h1desc)
            .replaceAll('$CONTENT', pageContent)
            .replaceAll('$CODE', pageScript)
            .replaceAll('$INTERNALNAME', pageFile.replace('.pageattr', ''))
            .replaceAll('$GENMETA', buildNote);

        
        
        // Replace icon macros like <icon_warning></icon_warning> with
        // Material Symbols outlined markup: <span class="material-symbols-outlined">warning</span>
        const iconMacroRegex = /<icon_([a-z0-9_-]+)\s*>\s*<\/icon_\1\s*>/gi;
        const finalHTMLWithIcons = finalHTML.replace(iconMacroRegex, (m, p1) => `<span class="material-symbols-outlined">${p1}</span>`);

        fs.writeFileSync('./dist/' + pageFile.replace('.pageattr', '.html'), finalHTMLWithIcons, 'utf-8');

        fs.copyFileSync('./source/base/base.css', './dist/' + pageFile.replace('.pageattr','.css'));

        if (fs.existsSync('./source/pages/' + pageFile.replace('.pageattr', '.css'))) {
            console.log(chalk.blue('Cooking CSS for page: ') + pageFile.replace('.pageattr', ''));
            fs.appendFileSync('./dist/' + pageFile.replace('.pageattr', '.css'), '\n/* Custom CSS for ' + pageFile.replace('.pageattr', '') + ' */\n' + fs.readFileSync('./source/pages/' + pageFile.replace('.pageattr', '.css'), 'utf-8'));
        }
        console.log(chalk.green('Built page ') + '"' + pageFile.replace('.pageattr', '') + '" - "' + pageattr.h1title + '"');
    }

    var assets = fs.readdirSync('./source/assets/');
    for (const assetFile of assets) {
        fs.copyFileSync('./source/assets/' + assetFile, './dist/' + assetFile);
        console.log(chalk.green('Copied static asset to root: ') + assetFile);
    }

    console.log(chalk.yellowBright('Build complete in ' + ((process.uptime()) .toFixed(2)) + ' seconds.'));

    if (process.argv.includes('--serve')) {
        const app = express();
        const port = process.env.PORT || 3000;

        app.use(express.static('dist'));

        app.listen(port, () => {
            console.log(chalk.cyan(`Serving MiscTools at http://localhost:${port}`));
            require('child_process').exec(`start http://localhost:${port}`);
        });
    }
})();