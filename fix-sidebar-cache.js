const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend', 'ucc');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let sidebarCount = 0;
let cssCount = 0;

for (const f of files) {
    const p = path.join(dir, f);
    let c = fs.readFileSync(p, 'utf8');

    // Cache-bust sidebar.js
    const newC1 = c.replace(/<script src="assets\/js\/sidebar\.js">/g, '<script src="assets/js/sidebar.js?v=2">');
    if (newC1 !== c) {
        c = newC1;
        sidebarCount++;
    }

    // Cache-bust design-system.css so the new search CSS loads fresh
    const newC2 = c.replace(/<link rel="stylesheet" href="assets\/css\/design-system\.css">/g, '<link rel="stylesheet" href="assets/css/design-system.css?v=2">');
    if (newC2 !== c) {
        c = newC2;
        cssCount++;
    }

    fs.writeFileSync(p, c, 'utf8');
}

console.log('sidebar.js cache-busted in:', sidebarCount, 'files');
console.log('design-system.css cache-busted in:', cssCount, 'files');