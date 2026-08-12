// ==========================================================================
// EduSmart Payroll Management JavaScript
// ==========================================================================

let currentMonth = '';
let currentYear = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', function () {
    // Set default month/year
    const now = new Date();
    currentMonth = now.toLocaleString('default', { month: 'long' });
    currentYear = now.getFullYear();

    setupYearDropdowns();
    setupMonthFilter();

    document.getElementById('payrollForm')?.addEventListener('submit', handleFormSubmit);
    loadPayroll();
    loadPayrollSummary();
});

function setupYearDropdowns() {
    const year = new Date().getFullYear();
    const years = [year - 1, year, year + 1];
    ['yearFilter', 'payYear'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = years.map(y => `<option value="${y}"${y === year ? ' selected' : ''}>${y}</option>`).join('');
    });
}

function setupMonthFilter() {
    const monthEl = document.getElementById('monthFilter');
    if (monthEl) {
        const months = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
        const curMonth = new Date().toLocaleString('default', { month: 'long' });
        months.forEach(m => {
            const opt = monthEl.querySelector(`option[value="${m}"]`);
            if (opt && m === curMonth) opt.selected = true;
        });
    }
    const monthFormEl = document.getElementById('month');
    if (monthFormEl) {
        const curMonth = new Date().toLocaleString('default', { month: 'long' });
        const opt = monthFormEl.querySelector(`option[value="${curMonth}"]`);
        if (opt) opt.selected = true;
    }
}

// ==========================================================================
// Load & Render
// ==========================================================================
async function loadPayroll() {
    const tbody = document.getElementById('payrollTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="12" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';

    try {
        const month = document.getElementById('monthFilter')?.value || '';
        const year = document.getElementById('yearFilter')?.value || currentYear;
        const status = document.getElementById('statusFilter')?.value || '';
        const search = document.getElementById('employeeSearch')?.value?.trim() || '';

        let url = `/api/payroll?limit=100`;
        if (month) url += `&month=${encodeURIComponent(month)}`;
        if (year) url += `&year=${year}`;
        if (status) url += `&status=${encodeURIComponent(status)}`;

        const res = await fetch(url);
        const data = await res.json();

        if (!data.success) {
            showError('Failed to load payroll records.');
            return;
        }

        let records = data.records || [];

        // Client-side search filter
        if (search) {
            records = records.filter(r =>
                (r.employeeName || '').toLowerCase().includes(search.toLowerCase()) ||
                (r.employeeId || '').toLowerCase().includes(search.toLowerCase()) ||
                (r.designation || '').toLowerCase().includes(search.toLowerCase())
            );
        }

        renderPayrollTable(records);

        const countEl = document.getElementById('payrollCount');
        if (countEl) countEl.textContent = `Total: ${records.length}`;

        // Summary
        loadPayrollSummary();
    } catch (err) {
        console.error('Error loading payroll:', err);
        showError('Network error loading payroll.');
    }
}

function renderPayrollTable(records) {
    const tbody = document.getElementById('payrollTableBody');
    const footer = document.getElementById('payrollTotalFooter');
    if (!tbody) return;

    if (!records || records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" class="text-center">
            <div style="padding:30px;color:var(--text-muted);">
                <i class="fas fa-inbox" style="font-size:2rem;opacity:0.4;display:block;margin-bottom:8px;"></i>
                No payroll records found for this period.
            </div></td></tr>`;
        if (footer) footer.style.display = 'none';
        return;
    }

    const totSalary = records.reduce((s, r) => s + (r.salary || 0), 0);
    const totPaid = records.reduce((s, r) => s + (r.paidAmount || 0), 0);
    const totDue = records.reduce((s, r) => s + (r.dueSalary || 0), 0);
    const totNet = records.reduce((s, r) => s + (r.netPayable || 0), 0);

    tbody.innerHTML = records.map(r => {
        const st = (r.status || 'Pending').toLowerCase();
        return `<tr>
            <td><strong>${escHtml(r.employeeId)}</strong></td>
            <td>${escHtml(r.employeeName)}</td>
            <td><span class="badge badge-info">${escHtml(r.designation)}</span></td>
            <td>${formatCurrency(r.salary)}</td>
            <td style="color:#059669;font-weight:700;">${formatCurrency(r.paidAmount || 0)}</td>
            <td style="color:#dc2626;font-weight:700;">${formatCurrency(r.dueSalary || 0)}</td>
            <td style="color:#f59e0b;">${formatCurrency(r.bonus || 0)}</td>
            <td style="color:#6b7280;">${formatCurrency(r.deduction || 0)}</td>
            <td style="font-weight:800;color:#1e40af;">${formatCurrency(r.netPayable || 0)}</td>
            <td><span class="badge badge-secondary">${escHtml(r.paymentMethod || '-')}</span></td>
            <td><span class="status-badge ${st}">${escHtml(r.status || 'Pending')}</span></td>
            <td style="white-space:nowrap;">
                <button class="btn btn-sm btn-primary" onclick="editRecord('${r._id}')" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-info" onclick="printPayslip('${r._id}')" title="Payslip"><i class="fas fa-file-alt"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteRecord('${r._id}')" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('');

    if (footer) {
        footer.style.display = 'flex';
        footer.style.justifyContent = 'space-between';
        footer.style.flexWrap = 'wrap';
        footer.style.gap = '12px';
        footer.innerHTML = `
            <span>Records: <strong>${records.length}</strong></span>
            <span>Total Salary: <strong>${formatCurrency(totSalary)}</strong></span>
            <span style="color:#059669;">Total Paid: <strong>${formatCurrency(totPaid)}</strong></span>
            <span style="color:#dc2626;">Total Due: <strong>${formatCurrency(totDue)}</strong></span>
            <span style="color:#1e40af;">Total Net: <strong>${formatCurrency(totNet)}</strong></span>
        `;
    }
}

// ==========================================================================
// Summary Cards
// ==========================================================================
async function loadPayrollSummary() {
    try {
        const month = document.getElementById('monthFilter')?.value || currentMonth;
        const year = document.getElementById('yearFilter')?.value || currentYear;
        const res = await fetch(`/api/payroll/summary?month=${encodeURIComponent(month)}&year=${year}`);
        const data = await res.json();
        if (!data.success) return;

        setEl('totalEmployees', data.totalEmployees || 0);
        setEl('totalSalary', formatCurrency(data.totalSalary || 0));
        setEl('totalPaid', formatCurrency(data.totalPaid || 0));
        setEl('totalDue', formatCurrency(data.totalDue || 0));
        setEl('paidCount', data.paidCount || 0);
        setEl('pendingCount', data.pendingCount || 0);
    } catch (err) { console.error('Error loading payroll summary:', err); }
}

function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ==========================================================================
// Form
// ==========================================================================
function calculateNet() {
    const salary = parseFloat(document.getElementById('salary')?.value || 0);
    const bonus = parseFloat(document.getElementById('bonus')?.value || 0);
    const deduction = parseFloat(document.getElementById('deduction')?.value || 0);
    const net = salary + bonus - deduction;
    const display = document.getElementById('netPayableDisplay');
    if (display) display.textContent = formatCurrency(Math.max(0, net));
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; }

    const id = document.getElementById('payrollId')?.value;
    const salary = parseFloat(document.getElementById('salary')?.value || 0);
    const bonus = parseFloat(document.getElementById('bonus')?.value || 0);
    const deduction = parseFloat(document.getElementById('deduction')?.value || 0);
    const paidAmount = parseFloat(document.getElementById('paidAmount')?.value || 0);

    const body = {
        employeeId: document.getElementById('employeeId')?.value?.trim(),
        employeeName: document.getElementById('employeeName')?.value?.trim(),
        designation: document.getElementById('designation')?.value?.trim(),
        salary,
        bonus,
        deduction,
        paidAmount,
        advance: parseFloat(document.getElementById('advance')?.value || 0),
        month: document.getElementById('month')?.value,
        year: parseInt(document.getElementById('payYear')?.value),
        paymentDate: document.getElementById('paymentDate')?.value,
        paymentMethod: document.getElementById('paymentMethod')?.value,
        notes: document.getElementById('notes')?.value?.trim(),
        createdBy: 'Admin'
    };

    try {
        const url = id ? `/api/payroll/${id}` : '/api/payroll';
        const method = id ? 'PUT' : 'POST';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (data.success) {
            showToast(id ? 'Payroll updated!' : 'Payroll record added!', 'success');
            closeModal();
            loadPayroll();
        } else {
            showToast('Error: ' + (data.message || 'Unknown error'), 'error');
        }
    } catch (err) {
        showToast('Network error. Please try again.', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check"></i> Save Payroll'; }
    }
}

async function editRecord(id) {
    try {
        const res = await fetch(`/api/payroll/${id}`);
        const data = await res.json();
        if (!data.success) { showToast('Could not load record.', 'error'); return; }
        const r = data.record;

        document.getElementById('payrollId').value = r._id;
        document.getElementById('employeeId').value = r.employeeId;
        document.getElementById('employeeName').value = r.employeeName;
        document.getElementById('designation').value = r.designation;
        document.getElementById('salary').value = r.salary;
        document.getElementById('bonus').value = r.bonus || 0;
        document.getElementById('deduction').value = r.deduction || 0;
        document.getElementById('paidAmount').value = r.paidAmount || 0;
        document.getElementById('advance').value = r.advance || 0;
        document.getElementById('month').value = r.month;
        document.getElementById('payYear').value = r.year;
        document.getElementById('paymentDate').value = r.paymentDate || '';
        document.getElementById('paymentMethod').value = r.paymentMethod || 'Cash';
        document.getElementById('notes').value = r.notes || '';

        calculateNet();
        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Payroll Record';
        openModal();
    } catch (err) { showToast('Error loading record.', 'error'); }
}

async function deleteRecord(id) {
    if (!confirm('Delete this payroll record?')) return;
    try {
        const res = await fetch(`/api/payroll/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) { showToast('Record deleted.', 'success'); loadPayroll(); }
        else showToast('Error: ' + data.message, 'error');
    } catch (err) { showToast('Error deleting record.', 'error'); }
}

// ==========================================================================
// Payslip Print
// ==========================================================================
async function printPayslip(id) {
    try {
        const res = await fetch(`/api/payroll/${id}`);
        const data = await res.json();
        if (!data.success) { showToast('Could not load payslip.', 'error'); return; }
        const r = data.record;

        let instituteName = 'EduSmart Coaching Center';
        try {
            const instRes = await fetch('/api/institute/public');
            const instData = await instRes.json();
            if (instData.success && instData.data?.name) instituteName = instData.data.name;
        } catch(e) {}

        const win = window.open('', '_blank', 'width=700,height=600');
        win.document.write(`<!DOCTYPE html><html><head><title>Payslip</title>
        <style>
            body{font-family:'Segoe UI',sans-serif;padding:30px;font-size:11pt;}
            .header{text-align:center;border-bottom:2px double #1e40af;padding-bottom:14px;margin-bottom:18px;}
            .header h2{color:#1e40af;font-size:14pt;}
            .title{font-size:11pt;font-weight:700;background:#eff6ff;padding:4px 10px;display:inline-block;margin-top:6px;}
            table{width:100%;border-collapse:collapse;margin:12px 0;}
            td{padding:8px 12px;border:1px solid #e5e7eb;font-size:10pt;}
            .lbl{font-weight:700;background:#f9fafb;width:140px;}
            .amount-row{background:#fef3c7;font-weight:700;font-size:12pt;}
            .signatures{display:flex;justify-content:space-between;margin-top:40px;}
            .sig{text-align:center;width:45%;}
            .sig-line{border-top:1px solid #374151;padding-top:6px;margin-top:40px;font-weight:600;font-size:9pt;}
            @media print{button{display:none;}}
        </style></head><body>
        <div class="header">
            <h2>${escHtml(instituteName)}</h2>
            <div class="title">SALARY PAYSLIP</div>
        </div>
        <table>
            <tr><td class="lbl">Employee ID</td><td>${escHtml(r.employeeId)}</td><td class="lbl">Name</td><td>${escHtml(r.employeeName)}</td></tr>
            <tr><td class="lbl">Designation</td><td>${escHtml(r.designation)}</td><td class="lbl">Period</td><td>${escHtml(r.month)} ${r.year}</td></tr>
            <tr><td class="lbl">Basic Salary</td><td>৳${(r.salary||0).toFixed(2)}</td><td class="lbl">Bonus</td><td>৳${(r.bonus||0).toFixed(2)}</td></tr>
            <tr><td class="lbl">Deduction</td><td>৳${(r.deduction||0).toFixed(2)}</td><td class="lbl">Advance</td><td>৳${(r.advance||0).toFixed(2)}</td></tr>
            <tr class="amount-row"><td class="lbl">Net Payable</td><td>৳${(r.netPayable||0).toFixed(2)}</td><td class="lbl">Paid Amount</td><td>৳${(r.paidAmount||0).toFixed(2)}</td></tr>
            <tr><td class="lbl">Due Salary</td><td style="color:#dc2626;font-weight:700;">৳${(r.dueSalary||0).toFixed(2)}</td><td class="lbl">Payment Method</td><td>${escHtml(r.paymentMethod||'-')}</td></tr>
            <tr><td class="lbl">Payment Date</td><td>${r.paymentDate||'-'}</td><td class="lbl">Status</td><td><strong>${escHtml(r.status||'-')}</strong></td></tr>
            ${r.notes ? `<tr><td class="lbl">Notes</td><td colspan="3">${escHtml(r.notes)}</td></tr>` : ''}
        </table>
        <div class="signatures">
            <div class="sig"><div class="sig-line">Employee Signature</div></div>
            <div class="sig"><div class="sig-line">Authorized Signature</div></div>
        </div>
        <br><button onclick="window.print()">🖨 Print</button>
        </body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 400);
    } catch (err) { showToast('Error generating payslip.', 'error'); }
}

async function printPayrollSummary() {
    try {
        const month = document.getElementById('monthFilter')?.value || currentMonth;
        const year = document.getElementById('yearFilter')?.value || currentYear;
        const res = await fetch(`/api/payroll?month=${encodeURIComponent(month)}&year=${year}&limit=200`);
        const data = await res.json();
        if (!data.success) return;
        const records = data.records || [];

        let instituteName = 'EduSmart Coaching Center';
        try {
            const instRes = await fetch('/api/institute/public');
            const instData = await instRes.json();
            if (instData.success && instData.data?.name) instituteName = instData.data.name;
        } catch(e) {}

        const rows = records.map(r => `<tr>
            <td>${escHtml(r.employeeId)}</td><td>${escHtml(r.employeeName)}</td>
            <td>${escHtml(r.designation)}</td>
            <td style="text-align:right;">৳${(r.salary||0).toFixed(2)}</td>
            <td style="text-align:right;color:#059669;">৳${(r.paidAmount||0).toFixed(2)}</td>
            <td style="text-align:right;color:#dc2626;">৳${(r.dueSalary||0).toFixed(2)}</td>
            <td style="text-align:right;">৳${(r.netPayable||0).toFixed(2)}</td>
            <td>${escHtml(r.status||'-')}</td>
        </tr>`).join('');

        const totSal = records.reduce((s,r)=>s+(r.salary||0),0);
        const totPaid = records.reduce((s,r)=>s+(r.paidAmount||0),0);
        const totDue = records.reduce((s,r)=>s+(r.dueSalary||0),0);
        const totNet = records.reduce((s,r)=>s+(r.netPayable||0),0);

        const win = window.open('', '_blank', 'width=900,height=700');
        win.document.write(`<!DOCTYPE html><html><head><title>Payroll Summary</title>
        <style>
            body{font-family:'Segoe UI',sans-serif;padding:20px;font-size:10pt;}
            h2{color:#1e40af;border-bottom:2px solid #1e40af;padding-bottom:8px;margin-bottom:16px;}
            table{width:100%;border-collapse:collapse;}
            th{background:#1e40af;color:white;padding:6px 8px;text-align:left;font-size:9pt;}
            td{padding:5px 8px;border:1px solid #e5e7eb;}
            tr:nth-child(even){background:#f9fafb;}
            .total-row{background:#fef3c7;font-weight:700;}
            @media print{button{display:none;}}
        </style></head><body>
        <h2>${escHtml(instituteName)} – Payroll Summary (${month} ${year})</h2>
        <table>
            <thead><tr><th>ID</th><th>Name</th><th>Designation</th><th>Salary</th><th>Paid</th><th>Due</th><th>Net</th><th>Status</th></tr></thead>
            <tbody>${rows}
            <tr class="total-row">
                <td colspan="3">Total (${records.length})</td>
                <td style="text-align:right;">৳${totSal.toFixed(2)}</td>
                <td style="text-align:right;">৳${totPaid.toFixed(2)}</td>
                <td style="text-align:right;">৳${totDue.toFixed(2)}</td>
                <td style="text-align:right;">৳${totNet.toFixed(2)}</td>
                <td></td>
            </tr></tbody>
        </table>
        <br><button onclick="window.print()">🖨 Print</button>
        </body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 400);
    } catch (err) { showToast('Error printing summary.', 'error'); }
}

// ==========================================================================
// Modal helpers
// ==========================================================================
function openModal() { document.getElementById('payrollModal')?.classList.add('active'); }

function closeModal() {
    document.getElementById('payrollModal')?.classList.remove('active');
    document.getElementById('payrollForm')?.reset();
    document.getElementById('payrollId').value = '';
    calculateNet();
}

function openAddModal() {
    closeModal();
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Add Payroll Record';
    const now = new Date();
    const monthEl = document.getElementById('month');
    const curM = now.toLocaleString('default', { month: 'long' });
    if (monthEl) {
        const opt = monthEl.querySelector(`option[value="${curM}"]`);
        if (opt) opt.selected = true;
    }
    openModal();
}

function clearFilters() {
    const monthEl = document.getElementById('monthFilter');
    const curM = new Date().toLocaleString('default', { month: 'long' });
    if (monthEl) {
        const opt = monthEl.querySelector(`option[value="${curM}"]`);
        if (opt) opt.selected = true;
    }
    const yearEl = document.getElementById('yearFilter');
    if (yearEl) yearEl.value = new Date().getFullYear();
    const statusEl = document.getElementById('statusFilter');
    if (statusEl) statusEl.value = '';
    const searchEl = document.getElementById('employeeSearch');
    if (searchEl) searchEl.value = '';
    loadPayroll();
}

// ==========================================================================
// Utility
// ==========================================================================
function formatCurrency(amount) {
    return '৳' + parseFloat(amount || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function escHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function showError(msg) {
    const tbody = document.getElementById('payrollTableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="12">
        <div style="text-align:center;padding:30px;color:#dc2626;">
            <i class="fas fa-exclamation-triangle" style="font-size:2rem;display:block;margin-bottom:8px;"></i>
            <p>${escHtml(msg)}</p>
            <button class="btn btn-primary" style="margin-top:12px;" onclick="loadPayroll()">
                <i class="fas fa-redo"></i> Retry
            </button>
        </div></td></tr>`;
}

function showToast(msg, type = 'success') {
    if (typeof showNotification === 'function') { showNotification(msg, type); return; }
    let c = document.getElementById('toastContainer');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toastContainer';
        c.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
        document.body.appendChild(c);
    }
    const t = document.createElement('div');
    t.style.cssText = `padding:12px 20px;border-radius:8px;color:white;font-weight:600;font-size:0.9rem;
        box-shadow:0 4px 15px rgba(0,0,0,0.2);min-width:250px;
        background:${type==='success'?'#059669':type==='error'?'#dc2626':'#3b82f6'};`;
    t.innerHTML = `<i class="fas fa-${type==='success'?'check-circle':'exclamation-circle'}"></i> ${escHtml(msg)}`;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity 0.3s'; setTimeout(()=>t.remove(),300); }, 3000);
}
