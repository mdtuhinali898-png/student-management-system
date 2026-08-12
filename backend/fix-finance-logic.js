// Temporary: fix due logic in finance.js — paid<fee → due, change to paid===0 → due
const fs = require('fs');
const file = 'routes/finance.js';
let c = fs.readFileSync(file, 'utf8');

// Old pattern (both dashboard & due-summary)
const oldPattern = `            targetMonths.forEach(m => {
                const paid = sPays[m] || 0;
                if (paid < fee) {
                    const monthDue = fee - paid;
                    due += monthDue;
                    unpaidMonths.push({ month: m, due: monthDue });
                }
            });`;

// New pattern: any payment (>0) = paid; only ZERO payment = Due
const newPattern = `            targetMonths.forEach(m => {
                const paid = sPays[m] || 0;
                if (paid === 0) {
                    due += fee;
                    unpaidMonths.push({ month: m, due: fee });
                }
            });`;

const count = (c.match(new RegExp(oldPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
c = c.split(oldPattern).join(newPattern);
fs.writeFileSync(file, c);

console.log('Replaced occurrences:', count);
console.log('Remaining "paid < fee":', (c.match(/paid < fee/g) || []).length);
console.log('New "paid === 0":', (c.match(/paid === 0/g) || []).length);
