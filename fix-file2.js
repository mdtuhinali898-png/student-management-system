const fs = require('fs');

// Fix add-student.html - remove >>>>>>> markers
const htmlPath = 'd:\\Sms new\\frontend\\add-student.html';
let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/^[^\n]*>>>>>>>[^\n]*\n/gm, '');
fs.writeFileSync(htmlPath, html);
console.log('Fixed add-student.html');

// Update add-student.js - include both admission fee and monthly fee in payment
const jsPath = 'd:\\Sms new\\frontend\\assets\\js\\add-student.js';
let js = fs.readFileSync(jsPath, 'utf8');

// Replace the payment data section to include both fees and admission month
js = js.replace(
    /const paymentData = \{\n\s+studentId: student\.studentId,\n\s+studentName: student\.name,\n\s+month: currentMonth,\n\s+year: currentYear,\n\s+fee: payload\.admissionFee,\n\s+discount: 0,\n\s+fine: 0,\n\s+amount: payload\.admissionFee,\n\s+paymentMethod: 'Cash',\n\s+type: 'Admission',\n\s+status: 'Paid',\n\s+remarks: 'Admission fee payment',\n\s+date: today\n\s+\};/,
    `const admissionMonth = document.getElementById('admissionMonth').value;\n                const monthlyFee = payload.fee;\n                const admissionFee = payload.admissionFee;\n                const totalAmount = admissionFee + monthlyFee;\n\n                const paymentData = {\n                    studentId: student.studentId,\n                    studentName: student.name,\n                    month: admissionMonth,\n                    year: currentYear,\n                    fee: monthlyFee,\n                    discount: 0,\n                    fine: 0,\n                    amount: totalAmount,\n                    paymentMethod: 'Cash',\n                    type: 'Admission',\n                    status: 'Paid',\n                    remarks: 'Admission Fee: ' + admissionFee + ', Monthly Fee: ' + monthlyFee,\n                    date: today\n                };`
);

// Also update the success message to show both fees
js = js.replace(
    /msg \+= `\\n\\nAdmission Fee: ৳\$\{payload\.admissionFee\}\\nReceipt No: \$\{receiptNo\}`;/,
    `msg += \`\\n\\nAdmission Fee: ৳\${payload.admissionFee}\\nMonthly Fee: ৳\${payload.fee}\\nTotal Paid: ৳\${payload.admissionFee + payload.fee}\\nReceipt No: \${receiptNo}\`;`
);

fs.writeFileSync(jsPath, js);
console.log('Updated add-student.js');

// Update receipt.js - show both monthly fee and admission fee for admission receipts
const receiptPath = 'd:\\Sms new\\frontend\\assets\\js\\receipt.js';
let receipt = fs.readFileSync(receiptPath, 'utf8');

// Replace the admission receipt payment details section
receipt = receipt.replace(
    /if \(isAdmission\) \{\n\s+\/\/ For admission receipts: show Admission Fee as the main item\n\s+document\.getElementById\('monthlyFee'\)\.innerText = '0\.00';\n\s+document\.getElementById\('admissionFeeRow'\)\.style\.display = '';\n\s+document\.getElementById\('admissionFee'\)\.innerText = fee\.toFixed\(2\);\n\s+document\.getElementById\('fine'\)\.innerText = fine\.toFixed\(2\);\n\s+document\.getElementById\('discount'\)\.innerText = '-' \+ discount\.toFixed\(2\);/,
    `if (isAdmission) {\n            // For admission receipts: show both Monthly Tuition Fee and Admission Fee\n            const admissionFee = (paid - fee) > 0 ? (paid - fee) : 0;\n            document.getElementById('monthlyFee').innerText = fee.toFixed(2);\n            document.getElementById('admissionFeeRow').style.display = '';\n            document.getElementById('admissionFee').innerText = admissionFee.toFixed(2);\n            document.getElementById('fine').innerText = fine.toFixed(2);\n            document.getElementById('discount').innerText = '-' + discount.toFixed(2);`
);

fs.writeFileSync(receiptPath, receipt);
console.log('Updated receipt.js');
