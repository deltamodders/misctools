const fs = require('fs');
const chalk = require('chalk');
const express = require('express');
//a

console.clear();
console.log(chalk.blue('MiscTools Builder') + "\nAuthor: GhinoRhino");
console.log('[' + '-'.repeat(process.stdout.columns - 2) + ']');

if (fs.existsSync('./docs')) {
    fs.rmSync('./docs', { recursive: true, force: true });
}

fs.mkdirSync('./docs');

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
        
        fs.writeFileSync('./docs/' + pageFile.replace('.pageattr', '.html'), finalHTML, 'utf-8');

        fs.copyFileSync('./source/base/base.css', './docs/' + pageFile.replace('.pageattr','.css'));

        if (fs.existsSync('./source/pages/' + pageFile.replace('.pageattr', '.css'))) {
            console.log(chalk.blue('Cooking CSS for page: ') + pageFile.replace('.pageattr', ''));
            fs.appendFileSync('./docs/' + pageFile.replace('.pageattr', '.css'), '\n/* Custom CSS for ' + pageFile.replace('.pageattr', '') + ' */\n' + fs.readFileSync('./source/pages/' + pageFile.replace('.pageattr', '.css'), 'utf-8'));
        }
        console.log(chalk.green('Built page ') + '"' + pageFile.replace('.pageattr', '') + '" - "' + pageattr.h1title + '"');
    }

    var assets = fs.readdirSync('./source/assets/');
    for (const assetFile of assets) {
        fs.copyFileSync('./source/assets/' + assetFile, './docs/' + assetFile);
        console.log(chalk.green('Copied static asset to root: ') + assetFile);
    }

    console.log(chalk.yellowBright('Build complete in ' + ((process.uptime()) .toFixed(2)) + ' seconds.'));

    if (process.argv.includes('--serve')) {
        const app = express();
        const port = process.env.PORT || 3000;

        app.use(express.static('docs'));

        app.listen(port, () => {
            console.log(chalk.cyan(`Serving MiscTools at http://localhost:${port}`));
            require('child_process').exec(`start http://localhost:${port}`);
        });
    }
})();