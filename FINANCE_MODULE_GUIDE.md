// Expense Management JavaScript
let selectedExpenses = new Set();
let currentExpenseId = null;

document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    loadExpenses();
    loadCategoriesTable();
    loadVendors();
    
    // Set default date and time
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    document.getElementById('time').value = new Date().toTimeString().substring(0, 5);
    
    // Form submission
    document.getElementById('expenseForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('categoryForm').addEventListener('submit', handleCategorySubmit);
});

async function loadCategories() {
    try {
        const response = await fetch('/api/expenses/categories/all');
        const data = await response.json();
        
        if (data.success) {
            const categorySelect = document.getElementById('category');
            const filterSelect = document.getElementById('categoryFilter');
            
            categorySelect.innerHTML = '<option value="">Select Category</option>';
            filterSelect.innerHTML = '<option value="all">All Categories</option>';
            
            data.categories.forEach(cat => {
                categorySelect.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
                filterSelect.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadSubCategories() {
    const category = document.getElementById('category').value;
    const subCategorySelect = document.getElementById('subCategory');
    subCategorySelect.innerHTML = '<option value="">Select Sub Category</option>';
    if (!category) return;
    
    try {
        const response = await fetch('/api/expenses/categories/all');
        const data = await response.json();
        
        if (data.success) {
            const selectedCategory = data.categories.find(c => c.name === category);
            if (selectedCategory && selectedCategory.subCategories) {
                selectedCategory.subCategories.forEach(sub => {
                    subCategorySelect.innerHTML += `<option value="${sub.name}">${sub.name}</option>`;
                });
            }
        }
    } catch (error) {
        console.error('Error loading sub-categories:', error);
    }
}

async function loadVendors() {
    try {
        const response = await fetch('/api/expenses?limit=1');
        const data = await response.json();
        if (data.success && data.vendors) {
            const vendorFilter = document.getElementById('vendorFilter');
            vendorFilter.innerHTML = '<option value="all">All Vendors</option>';
            data.vendors.forEach(v => {
                vendorFilter.innerHTML += `<option value="${v}">${v}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading vendors:', error);
    }
}

async function loadExpenses() {
    try {
        const search = document.getElementById('searchInput').value;
        const category = document.getElementById('categoryFilter').value;
        const method = document.getElementById('methodFilter').value;
        const status = document.getElementById('statusFilter').value;
        const vendor = document.getElementById('vendorFilter').value;
        const fromDate = document.getElementById('fromDateFilter').value;
        const toDate = document.getElementById('toDateFilter').value;
        const amountMin = document.getElementById('amountMinFilter').value;
        const amountMax = document.getElementById('amountMaxFilter').value;
        
        let url = '/api/expenses?limit=100';
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (category && category !== 'all') url += `&category=${encodeURIComponent(category)}`;
        if (method && method !== 'all') url += `&method=${encodeURIComponent(method)}`;
        if (status && status !== 'all') url += `&status=${encodeURIComponent(status)}`;
        if (vendor && vendor !== 'all') url += `&vendor=${encodeURIComponent(vendor)}`;
        if (fromDate) url += `&fromDate=${fromDate}`;
        if (toDate) url += `&toDate=${toDate}`;
        if (amountMin) url += `&amountMin=${amountMin}`;
        if (amountMax) url += `&amountMax=${amountMax}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            renderExpenseTable(data.expenses);
            document.getElementById('expenseCount').textContent = `Total: ${data.total}`;
            
            // Show filtered total
            const totalContainer = document.getElementById('filteredTotalContainer');
            if (data.totalFilteredAmount > 0) {
                totalContainer.innerHTML = `
                    <div class="filtered-total">
                        <span><i class="fas fa-calculator"></i> Total Filtered Expenses</span>
                        <span>${formatCurrency(data.totalFilteredAmount)}</span>
                    </div>
                `;
            } else {
                totalContainer.innerHTML = '';
            }
        }
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

function renderExpenseTable(expenses) {
    const tbody = document.getElementById('expenseTableBody');
    
    if (expenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No expenses found</td></tr>';
        return;
    }
    
    tbody.innerHTML = expenses.map(expense => {
        const isSelected = selectedExpenses.has(expense._id);
        const statusClass = getStatusClass(expense.status);
        const receiptHtml = expense.receiptFile 
            ? `<span class="receipt-badge has-receipt"><i class="fas fa-check-circle"></i> Attached</span>`
            : `<span class="receipt-badge no-receipt"><i class="fas fa-exclamation-triangle"></i> Missing</span>`;
        
        return `
            <tr class="${isSelected ? 'selected' : ''}">
                <td><input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleExpense('${expense._id}')"></td>
                <td><strong>${expense.expenseId}</strong></td>
                <td>${expense.date}<br><small class="text-muted">${expense.time}</small></td>
                <td>${expense.category}${expense.subCategory ? '<br><small>' + expense.subCategory + '</small>' : ''}</td>
                <td><strong>${formatCurrency(expense.amount)}</strong></td>
                <td><span class="badge badge-info">${expense.paymentMethod}</span></td>
                <td><span class="status-badge ${statusClass}">${expense.status}</span></td>
                <td>${receiptHtml}</td>
                <td>
                    <div style="display:flex;gap:4px;flex-wrap:wrap;">
                        <button class="btn btn-sm btn-primary" onclick="editExpense('${expense._id}')" title="Edit"><i class="fas fa-edit"></i></button>
                        ${expense.status === 'Pending Approval' ? `
                            <button class="btn btn-sm btn-success" onclick="openApprovalModal('${expense._id}')" title="Approve"><i class="fas fa-check"></i></button>
                            <button class="btn btn-sm btn-danger" onclick="openRejectionModal('${expense._id}')" title="Reject"><i class="fas fa-times"></i></button>
                        ` : ''}
                        ${expense.status !== 'Voided' ? `
                            <button class="btn btn-sm btn-secondary" onclick="openVoidModal('${expense._id}')" title="Void"><i class="fas fa-ban"></i></button>
                        ` : ''}
                        <button class="btn btn-sm btn-info" onclick="showVoucher('${expense._id}')" title="Voucher"><i class="fas fa-file-invoice"></i></button>
                        ${expense.receiptFile ? `<button class="btn btn-sm btn-info" onclick="viewReceipt('${expense.receiptFile}')" title="Receipt"><i class="fas fa-eye"></i></button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function getStatusClass(status) {
    switch(status) {
        case 'Draft': return 'draft';
        case 'Pending Approval': return 'pending';
        case 'Approved': return 'approved';
        case 'Rejected': return 'rejected';
        case 'Voided': return 'voided';
        default: return '';
    }
}

// Selection functions
function toggleExpense(id) {
    if (selectedExpenses.has(id)) {
        selectedExpenses.delete(id);
    } else {
        selectedExpenses.add(id);
    }
    updateBulkActions();
    loadExpenses(); // Re-render to show selection
}

function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('#expenseTableBody input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        const id = cb.closest('tr').querySelector('input[type="checkbox"]');
        // We need to get the expense ID from the row
    });
    
    // Simpler approach: select/deselect all visible
    const rows = document.querySelectorAll('#expenseTableBody tr');
    if (allChecked) {
        selectedExpenses.clear();
    } else {
        rows.forEach(row => {
            const cb = row.querySelector('input[type="checkbox"]');
            if (cb) {
                // Get ID from the edit button
                const editBtn = row.querySelector('.btn-primary[onclick*="editExpense"]');
                if (editBtn) {
                    const match = editBtn.getAttribute('onclick').match(/'([^']+)'/);
                    if (match) selectedExpenses.add(match[1]);
                }
            }
        });
    }
    updateBulkActions();
    loadExpenses();
}

function updateBulkActions() {
    const count = selectedExpenses.size;
    document.getElementById('selectedCount').textContent = count + ' selected';
    document.getElementById('bulkExportBtn').style.display = count > 0 ? 'inline-flex' : 'none';
    document.getElementById('bulkPrintBtn').style.display = count > 0 ? 'inline-flex' : 'none';
}

async function bulkExport() {
    if (selectedExpenses.size === 0) return;
    
    try {
        const response = await fetch('/api/expenses/bulk-export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: Array.from(selectedExpenses) })
        });
        const data = await response.json();
        
        if (data.success) {
            // Generate CSV
            let csv = 'Expense ID,Date,Category,Amount,Method,Status,Vendor,Description\n';
            data.expenses.forEach(e => {
                csv += `${e.expenseId},${e.date},${e.category},${e.amount},${e.paymentMethod},${e.status},${e.vendor || ''},"${(e.description || '').replace(/"/g, '""')}"\n`;
            });
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'expenses-export.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }
    } catch (error) {
        console.error('Error in bulk export:', error);
        alert('Error exporting expenses');
    }
}

function bulkPrint() {
    if (selectedExpenses.size === 0) return;
    
    fetch('/api/expenses/bulk-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedExpenses) })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            let html = `
                <html><head><title>Expense Report</title>
                <style>
                    body { font-family: Arial; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
                    th { background: #1e40af; color: white; }
                    h2 { text-align: center; }
                </style></head><body>
                <h2>Expense Report</h2>
                <p>Total: ${data.count} expenses | Amount: ${formatCurrency(data.totalAmount)}</p>
                <table>
                    <tr><th>ID</th><th>Date</th><th>Category</th><th>Amount</th><th>Method</th><th>Status</th></tr>
            `;
            data.expenses.forEach(e => {
                html += `<tr><td>${e.expenseId}</td><td>${e.date}</td><td>${e.category}</td><td>${formatCurrency(e.amount)}</td><td>${e.paymentMethod}</td><td>${e.status}</td></tr>`;
            });
            html += `<tr style="font-weight:bold;background:#fef3c7;"><td colspan="3">Total</td><td>${formatCurrency(data.totalAmount)}</td><td colspan="2"></td></tr>`;
            html += `</table></body></html>`;
            
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
        }
    })
    .catch(err => alert('Error: ' + err.message));
}

// Approval functions
let approvalExpenseId = null;
let isRejection = false;

function openApprovalModal(id) {
    approvalExpenseId = id;
    isRejection = false;
    document.getElementById('approvalModalTitle').innerHTML = '<i class="fas fa-check-circle"></i> Approve Expense';
    document.getElementById('approvalForm').style.display = 'block';
    document.getElementById('rejectionForm').style.display = 'none';
    document.getElementById('approvalExpenseInfo').textContent = 'Are you sure you want to approve this expense?';
    document.getElementById('approvalModal').classList.add('active');
}

function openRejectionModal(id) {
    approvalExpenseId = id;
    isRejection = true;
    document.getElementById('approvalModalTitle').innerHTML = '<i class="fas fa-times-circle"></i> Reject Expense';
    document.getElementById('approvalForm').style.display = 'none';
    document.getElementById('rejectionForm').style.display = 'block';
    document.getElementById('approvalModal').classList.add('active');
}

function closeApprovalModal() {
    document.getElementById('approvalModal').classList.remove('active');
    approvalExpenseId = null;
}

async function confirmApprove() {
    if (!approvalExpenseId) return;
    const approvedBy = document.getElementById('approvedBy').value || 'Admin';
    
    try {
        const response = await fetch(`/api/expenses/${approvalExpenseId}/approve`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approvedBy })
        });
        const data = await response.json();
        
        if (data.success) {
            alert('Expense approved successfully!');
            closeApprovalModal();
            loadExpenses();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error approving expense:', error);
        alert('Error approving expense');
    }
}

async function confirmReject() {
    if (!approvalExpenseId) return;
    const rejectedBy = document.getElementById('rejectedBy').value || 'Admin';
    const rejectionReason = document.getElementById('rejectionReason').value;
    
    if (!rejectionReason) {
        alert('Please provide a rejection reason');
        return;
    }
    
    try {
        const response = await fetch(`/api/expenses/${approvalExpenseId}/reject`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rejectedBy, rejectionReason })
        });
        const data = await response.json();
        
        if (data.success) {
            alert('Expense rejected!');
            closeApprovalModal();
            loadExpenses();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error rejecting expense:', error);
        alert('Error rejecting expense');
    }
}

// Void functions
let voidExpenseId = null;

function openVoidModal(id) {
    voidExpenseId = id;
    document.getElementById('voidExpenseInfo').textContent = 'Are you sure you want to void this expense? This action cannot be undone.';
    document.getElementById('voidModal').classList.add('active');
}

function closeVoidModal() {
    document.getElementById('voidModal').classList.remove('active');
    voidExpenseId = null;
}

async function confirmVoid() {
    if (!voidExpenseId) return;
    const voidReason = document.getElementById('voidReason').value;
    
    if (!voidReason) {
        alert('Please provide a reason for voiding');
        return;
    }
    
    try {
        const response = await fetch(`/api/expenses/${voidExpenseId}/void`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ voidReason, voidedBy: 'Admin' })
        });
        const data = await response.json();
        
        if (data.success) {
            alert('Expense voided successfully!');
            closeVoidModal();
            loadExpenses();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error voiding expense:', error);
        alert('Error voiding expense');
    }
}

// Voucher functions
async function showVoucher(id) {
    try {
        const response = await fetch(`/api/expenses/${id}`);
        const data = await response.json();
        
        if (data.success) {
            const e = data.expense;
            const voucherHtml = `
                <div class="voucher-container" id="voucherPrintArea">
                    <div class="voucher-header">
                        <h2>EXPENSE VOUCHER</h2>
                        <div class="voucher-no">Voucher #: ${e.expenseId}</div>
                    </div>
                    <div class="voucher-body">
                        <table>
                            <tr><td class="label">Date</td><td>${e.date}</td><td class="label">Time</td><td>${e.time}</td></tr>
                            <tr><td class="label">Category</td><td>${e.category}</td><td class="label">Sub Category</td><td>${e.subCategory || '-'}</td></tr>
                            <tr><td class="label">Amount</td><td><strong>${formatCurrency(e.amount)}</strong></td><td class="label">Payment Method</td><td>${e.paymentMethod}</td></tr>
                            <tr><td class="label">Vendor</td><td>${e.vendor || '-'}</td><td class="label">Status</td><td>${e.status}</td></tr>
                            <tr><td class="label">Description</td><td colspan="3">${e.description || '-'}</td></tr>
                            <tr><td class="label">Created By</td><td>${e.createdBy || 'Admin'}</td><td class="label">Approved By</td><td>${e.approvedBy || '-'}</td></tr>
                        </table>
                    </div>
                    <div class="voucher-footer">
                        <div class="signature">
                            <div class="line">Prepared By</div>
                        </div>
                        <div class="signature">
                            <div class="line">Approved By</div>
                        </div>
                    </div>
                </div>
                <div class="voucher-print-btn" style="text-align:center;margin-top:20px;">
                    <button class="btn btn-primary" onclick="printVoucher()"><i class="fas fa-print"></i> Print Voucher</button>
                </div>
            `;
            
            document.getElementById('voucherContent').innerHTML = voucherHtml;
            document.getElementById('voucherModal').classList.add('active');
        }
    } catch (error) {
        console.error('Error loading voucher:', error);
        alert('Error loading voucher');
    }
}

function closeVoucherModal() {
    document.getElementById('voucherModal').classList.remove('active');
}

function printVoucher() {
    const content = document.getElementById('voucherPrintArea').innerHTML;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
        <html><head><title>Expense Voucher</title>
        <style>
            body { font-family: Arial; padding: 20px; }
            .voucher-container { max-width: 600px; margin: 0 auto; }
            .voucher-header { text-align: center; border-bottom: 2px double #1e40af; padding-bottom: 16px; margin-bottom: 20px; }
            .voucher-header h2 { color: #1e40af; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 8px 12px; border: 1px solid #ddd; font-size: 14px; }
            td.label { font-weight: bold; background: #f9fafb; width: 140px; }
            .voucher-footer { margin-top: 30px; display: flex; justify-content: space-between; }
            .signature { text-align: center; width: 45%; }
            .signature .line { margin-top: 40px; border-top: 1px solid #333; padding-top: 6px; }
            @media print { body { padding: 0; } }
        </style></head>
        <body>${content}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
}

function viewReceipt(filePath) {
    if (filePath) {
        window.open(filePath, '_blank');
    }
}

// Existing functions
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const expenseId = document.getElementById('expenseId').value;
    const formData = {
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        category: document.getElementById('category').value,
        subCategory: document.getElementById('subCategory').value,
        paymentMethod: document.getElementById('paymentMethod').value,
        amount: parseFloat(document.getElementById('amount').value),
        vendor: document.getElementById('vendor').value,
        description: document.getElementById('description').value,
        status: document.getElementById('formStatus') ? document.getElementById('formStatus').value : 'Approved'
    };
    
    // Handle file upload
    const receiptFile = document.getElementById('receiptFile').files[0];
    if (receiptFile) {
        formData.receiptFile = await uploadFile(receiptFile);
    }
    
    try {
        let response;
        if (expenseId) {
            response = await fetch(`/api/expenses/${expenseId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        } else {
            response = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        }
        
        const data = await response.json();
        
        if (data.success) {
            alert(expenseId ? 'Expense updated successfully!' : 'Expense added successfully!');
            closeModal();
            loadExpenses();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error saving expense:', error);
        alert('Error saving expense. Please try again.');
    }
}

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        return data.filePath || null;
    } catch (error) {
        console.error('Error uploading file:', error);
        return null;
    }
}

async function editExpense(id) {
    try {
        const response = await fetch(`/api/expenses/${id}`);
        const data = await response.json();
        
        if (data.success) {
            const expense = data.expense;
            
            document.getElementById('expenseId').value = expense._id;
            document.getElementById('date').value = expense.date;
            document.getElementById('time').value = expense.time;
            document.getElementById('category').value = expense.category;
            document.getElementById('amount').value = expense.amount;
            document.getElementById('paymentMethod').value = expense.paymentMethod;
            document.getElementById('vendor').value = expense.vendor || '';
            document.getElementById('description').value = expense.description || '';
            
            if (document.getElementById('formStatus')) {
                document.getElementById('formStatus').value = expense.status;
            }
            
            // Show current receipt
            const receiptDiv = document.getElementById('currentReceipt');
            const receiptLink = document.getElementById('receiptLink');
            if (expense.receiptFile) {
                receiptDiv.style.display = 'block';
                receiptLink.href = expense.receiptFile;
            } else {
                receiptDiv.style.display = 'none';
            }
            
            // Load sub-categories and select
            await loadSubCategories();
            document.getElementById('subCategory').value = expense.subCategory || '';
            
            document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Expense';
            openModal();
        }
    } catch (error) {
        console.error('Error fetching expense:', error);
        alert('Error loading expense data');
    }
}

async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
        const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
        const data = await response.json();
        
        if (data.success) {
            alert('Expense deleted successfully!');
            loadExpenses();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Error deleting expense. Please try again.');
    }
}

function openModal() {
    document.getElementById('expenseModal').classList.add('active');
}

function closeModal() {
    document.getElementById('expenseModal').classList.remove('active');
    resetForm();
}

function openAddModal() {
    resetForm();
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Add Expense';
    openModal();
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    document.getElementById('time').value = new Date().toTimeString().substring(0, 5);
}

function resetForm() {
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseId').value = '';
    document.getElementById('currentReceipt').style.display = 'none';
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    document.getElementById('time').value = new Date().toTimeString().substring(0, 5);
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = 'all';
    document.getElementById('methodFilter').value = 'all';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('vendorFilter').value = 'all';
    document.getElementById('fromDateFilter').value = '';
    document.getElementById('toDateFilter').value = '';
    document.getElementById('amountMinFilter').value = '';
    document.getElementById('amountMaxFilter').value = '';
    loadExpenses();
}

function formatCurrency(amount) {
    return '৳' + parseFloat(amount || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Category Management Functions
async function loadCategoriesTable() {
    try {
        const response = await fetch('/api/expenses/categories/all');
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.getElementById('categoryTableBody');
            tbody.innerHTML = data.categories.map(cat => `
                <tr>
                    <td><strong>${cat.name}</strong></td>
                    <td>${cat.subCategories.map(s => s.name).join(', ') || '-'}</td>
                    <td>${cat.description || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editCategory('${cat._id}')" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteCategory('${cat._id}')" title="Delete"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function openCategoryModal() {
    document.getElementById('categoryModal').classList.add('active');
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryModalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Add Category';
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('active');
}

async function handleCategorySubmit(e) {
    e.preventDefault();
    
    const categoryId = document.getElementById('categoryId').value;
    const categoryName = document.getElementById('categoryName').value.trim();
    const categoryDescription = document.getElementById('categoryDescription').value.trim();
    const subCategoriesInput = document.getElementById('subCategoriesInput').value.trim();
    
    const subCategories = subCategoriesInput 
        ? subCategoriesInput.split(',').map(s => s.trim()).filter(s => s)
        : [];
    
    const categoryData = {
        name: categoryName,
        description: categoryDescription,
        subCategories: subCategories.map(name => ({ name }))
    };
    
    try {
        let response;
        if (categoryId) {
            response = await fetch(`/api/expenses/categories/${categoryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryData)
            });
        } else {
            response = await fetch('/api/expenses/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryData)
            });
        }
        
        const data = await response.json();
        
        if (data.success) {
            alert(categoryId ? 'Category updated successfully!' : 'Category added successfully!');
            closeCategoryModal();
            loadCategoriesTable();
            loadCategories();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error saving category:', error);
        alert('Error saving category. Please try again.');
    }
}

async function editCategory(id) {
    try {
        const response = await fetch('/api/expenses/categories/all');
        const data = await response.json();
        
        if (data.success) {
            const category = data.categories.find(c => c._id === id);
            if (category) {
                document.getElementById('categoryId').value = category._id;
                document.getElementById('categoryName').value = category.name;
                document.getElementById('categoryDescription').value = category.description || '';
                document.getElementById('subCategoriesInput').value = category.subCategories.map(s => s.name).join(', ');
                document.getElementById('categoryModalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Category';
                openCategoryModal();
            }
        }
    } catch (error) {
        console.error('Error fetching category:', error);
        alert('Error loading category data');
    }
}

async function deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
        const response = await fetch(`/api/expenses/categories/${id}`, { method: 'DELETE' });
        const data = await response.json();
        
        if (data.success) {
            alert('Category deleted successfully!');
            loadCategoriesTable();
            loadCategories();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category. Please try again.');
    }
}
</content>
</write_file>

Now let me update the task_progress and create the FINANCE_MODULE_GUIDE.md with the complete documentation:

<write_to_file>
<path>FINANCE_MODULE_GUIDE.md</path>
<content># Finance & Expense Module - Complete Upgrade Guide

## Overview
The Finance and Expense modules have been completely upgraded to a professional, database-connected financial management system. All data comes from MongoDB - no hardcoded/demo data.

---

## 1. New MongoDB Models Created

### ✅ Budget (`backend/models/Budget.js`)
- Fields: category, amount, month, year, notes, isActive, createdBy
- Index: category+month+year (unique), month+year
- Used for: Category-wise monthly budget tracking

### ✅ RecurringExpense (`backend/models/RecurringExpense.js`)
- Fields: title, category, subCategory, amount, paymentMethod, vendor, description, frequency (Weekly/Monthly/Yearly), nextDueDate, lastGeneratedDate, autoGenerate, status
- Used for: Automated recurring expense generation

### ✅ Payroll (`backend/models/Payroll.js`)
- Fields: employeeId, employeeName, designation, salary, paidAmount, dueSalary, advance, bonus, deduction, netPayable, month, year, paymentDate, paymentMethod, status
- Used for: Teacher/Staff salary management

### ✅ FinancialAccount (`backend/models/FinancialAccount.js`)
- Fields: accountType (Cash/Bank/bKash/Nagad/etc), accountName, balance, lastUpdated
- Used for: Tracking balances by payment method

### ✅ AuditLog (`backend/models/AuditLog.js`)
- Fields: user, action, module, recordId, oldValue, newValue, description, ip
- Used for: Complete financial audit trail

### ✅ Due (`backend/models/Due.js`)
- Fields: studentId, studentName, batch, month, year, feeAmount, paidAmount, dueAmount, status, dueDate
- Used for: Due collection tracking

### ✅ Enhanced Expense Model (`backend/models/Expense.js`)
- Added: rejectedBy, rejectedAt, rejectionReason, incomeSource field
- Status workflow: Draft → Pending Approval → Approved/Rejected/Voided

---

## 2. New API Routes Created

| Route | Method | Description |
|-------|--------|-------------|
| `/api/budgets` | GET | Get budgets with usage stats |
| `/api/budgets/summary` | GET | Budget summary with alerts |
| `/api/budgets` | POST | Create/update budget |
| `/api/budgets/:id` | PUT | Update budget |
| `/api/budgets/:id` | DELETE | Delete budget |
| `/api/audit-logs` | GET | Get audit logs with filters |
| `/api/audit-logs` | POST | Create audit log entry |
| `/api/audit-logs/summary` | GET | Audit log summary |
| `/api/payroll` | GET | Get payroll records |
| `/api/payroll/summary` | GET | Payroll summary |
| `/api/payroll/employees` | GET | Employee list |
| `/api/payroll` | POST | Create payroll record |
| `/api/payroll/:id` | PUT | Update payroll |
| `/api/payroll/:id` | DELETE | Delete payroll |
| `/api/recurring-expenses` | GET | Get recurring expenses |
| `/api/recurring-expenses/due` | GET | Due recurring expenses |
| `/api/recurring-expenses` | POST | Create recurring expense |
| `/api/recurring-expenses/:id/generate` | POST | Generate expense from template |
| `/api/recurring-expenses/:id` | PUT | Update recurring expense |
| `/api/recurring-expenses/:id` | DELETE | Delete recurring expense |
| `/api/expenses/:id/approve` | PATCH | Approve expense |
| `/api/expenses/:id/reject` | PATCH | Reject expense |
| `/api/expenses/:id/void` | PATCH | Void expense |
| `/api/expenses/bulk-export` | POST | Bulk export expenses |
| `/api/finance/dashboard` | GET | Full dashboard data (with date range) |
| `/api/finance/graph-data` | GET | Chart data (monthly, category, trend) |
| `/api/finance/income-sources` | GET | Income source breakdown |
| `/api/finance/due-summary` | GET | Due collection summary |
| `/api/finance/balances` | GET | Account balances |
| `/api/finance/reports/income` | GET | Income report |
| `/api/finance/reports/expense` | GET | Expense report |

---

## 3. Frontend Files Changed

| File | Changes |
|------|---------|
| `frontend/finance.html` | Complete rewrite - added date range selector, balance cards, due summary, charts, budget status, recent activity, error modal |
| `frontend/assets/js/finance.js` | Complete rewrite - all dashboard logic, Chart.js integration, date filtering, budget alerts, print/export |
| `frontend/expenses.html` | Enhanced filters (status, vendor, date range, amount range), bulk actions, approval/void/voucher modals, receipt badges |
| `frontend/assets/js/expenses.js` | Added selection, bulk export/print, approval workflow, void, voucher generation, receipt viewing |
| `backend/server.js` | Added 4 new route imports and registrations |
| `backend/routes/finance.js` | Complete rewrite - dashboard, graph-data, income-sources, due-summary, balances, reports |
| `backend/routes/expenses.js` | Enhanced filtering, approval/reject/void endpoints, bulk export, audit logging |
| `backend/models/Expense.js` | Added rejectedBy, rejectedAt, rejectionReason, incomeSource fields |

---

## 4. New Features Added

### A. Finance Dashboard
- **Date Range Selector**: Today, This Week, This Month, Last Month, This Year, Custom
- **Summary Cards**: Total Income, Total Expense, Profit/Loss, Available Balance
- **Balance Cards**: Cash in Hand, Bank Balance, bKash Balance, Nagad Balance, Total Available
- **Due Collection Summary**: Total Outstanding, Expected Collection, Overdue Count, Top Due Students, Batch-wise Due
- **Income vs Expense Bar Chart**: Monthly comparison (12 months)
- **Expense Category Pie/Doughnut Chart**: Category-wise breakdown
- **Income Source Pie Chart**: Source-wise income breakdown
- **7/30 Days Trend Line Chart**: Daily income vs expense trend
- **Budget Status**: Category-wise budget bars with alerts (70% warning, 90% high, 100% exceeded)
- **Recent Activity**: Recent expenses and income

### B. Expense Management
- **Advanced Filters**: Status, Vendor, From/To Date, Min/Max Amount
- **Status Badges**: Draft, Pending Approval, Approved, Rejected, Voided
- **Receipt Badges**: Shows if receipt is attached or missing
- **Bulk Selection**: Select multiple expenses for bulk export/print
- **Approval Workflow**: Approve/Reject with reason
- **Void System**: Void with reason (no permanent delete)
- **Expense Voucher**: Professional A4 print-friendly voucher
- **Receipt Viewing**: View attached receipts
- **Filtered Total**: Shows total amount of filtered results

### C. Budget Management
- Category-wise monthly budget
- Usage percentage with color-coded progress bars
- Alerts at 70%, 90%, and 100% usage
- Dashboard integration

### D. Payroll/Salary Module
- Employee salary management
- Monthly payroll summary
- Auto-creates expense entry on payment
- Due salary tracking

### E. Recurring Expenses
- Weekly/Monthly/Yearly recurring setup
- Auto-generation of expenses
- Due date tracking

### F. Audit Log
- Complete financial audit trail
- Tracks create, edit, approve, reject, void actions
- Stores old/new values for comparison

### G. Reports
- Income Report
- Expense Report
- Daily Summary
- Monthly Report
- Date Range Report
- Budget Report
- Print/PDF/Excel export

---

## 5. Data Flow & Connections

### Student Payment → Income → Finance Dashboard
1. Student makes payment → `Payment` model saved
2. Finance dashboard `/api/finance/dashboard` queries all `Payment` records
3. Income calculated: sum of all payment amounts
4. Income by source: Monthly Student Fee (type='Monthly') or Admission Fee (type='Admission')
5. Dashboard shows: Today's Income, Monthly Income, Total Income

### Expense → Approval → Finance Dashboard
1. Expense created with status (Draft/Pending Approval/Approved)
2. Admin approves/rejects via PATCH endpoints
3. Only **Approved** expenses count in financial calculations
4. Dashboard queries: `Expense.find({ status: 'Approved' })`
5. Voided/Rejected expenses excluded from profit/loss

### Budget → Expense → Alert
1. Budget set per category per month via `/api/budgets`
2. When loading dashboard, `/api/budgets` compares budget amount vs actual approved expenses
3. Usage percentage calculated: `(currentExpense / budgetAmount) * 100`
4. Alerts generated at thresholds: 70% (info), 90% (warning), 100%+ (danger)

### Cash/Bank/bKash/Nagad Balance Calculation
- **Cash in Hand** = Sum of all Cash payments - Sum of all Cash expenses (Approved)
- **Bank Balance** = Sum of Bank/Card/Cheque payments - Sum of Bank/Card/Cheque expenses
- **bKash Balance** = Sum of bKash payments - Sum of bKash expenses
- **Nagad Balance** = Sum of Nagad payments - Sum of Nagad expenses
- **Total Available** = Cash + Bank + bKash + Nagad

### Profit/Loss Calculation
- **Profit/Loss** = Total Income (all payments) - Total Approved Expense
- Only expenses with `status: 'Approved'` are counted
- Date range filtering applied when period is selected

---

## 6. Dashboard Card/Chart Data Sources

| Card/Chart | API Endpoint | Data Source |
|------------|-------------|-------------|
| Total Income | `/api/finance/dashboard` | `Payment.find({ date: { $gte, $lte } })` |
| Total Expense | `/api/finance/dashboard` | `Expense.find({ date: { $gte, $lte }, status: 'Approved' })` |
| Profit/Loss | `/api/finance/dashboard` | Income - Expense calculation |
| Available Balance | `/api/finance/dashboard` | Payment method-wise calculation |
| Cash in Hand | `/api/finance/dashboard` | Cash payments - Cash expenses |
| Bank Balance | `/api/finance/dashboard` | Bank/Card/Cheque payments - expenses |
| bKash Balance | `/api/finance/dashboard` | bKash payments - bKash expenses |
| Nagad Balance | `/api/finance/dashboard` | Nagad payments - Nagad expenses |
| Due Summary | `/api/finance/due-summary` | Student + Payment aggregation |
| Bar Chart | `/api/finance/graph-data` | Monthly Payment + Expense aggregation |
| Pie Chart | `/api/finance/graph-data` | Expense.aggregate by category |
| Income Source | `/api/finance/graph-data` | Payment type + incomeSource field |
| Trend Chart | `/api/finance/graph-data` | Daily Payment + Expense for 7/30 days |
| Budget Status | `/api/budgets` | Budget vs actual Expense comparison |

---

## 7. Empty State Handling

All charts and sections handle empty states gracefully:
- **No data**: Shows "No financial data available for this period."
- **No expense**: "No expense data available yet. Expense যোগ করলে এখানে category-wise breakdown দেখা যাবে।"
- **No income**: "No income data available yet."
- **No budget**: "No budget set for this month."
- **No due**: "No outstanding dues! All students are up to date."
- **No recent activity**: "No recent expenses/income."
- Charts remain visible with empty state messages (not hidden/removed)
- No NaN, undefined, or blank white spaces

---

## 8. Loading & Error States

- Loading overlay with spinner during API calls
- Error modal with retry button on failure
- Console errors logged for debugging
- Graceful degradation if individual API calls fail

---

## 9. Existing Data Compatibility

- All existing Payment and Expense data remains intact
- No database migration needed
- Existing student payment data automatically feeds into finance dashboard
- Existing expense data works with new approval system (default status: 'Approved')
- New fields have defaults for backward compatibility

---

## 10. Security Notes

- All API endpoints currently public (matching existing pattern)
- Role-based access can be added via middleware
- Audit log tracks all financial actions
- Void system prevents data loss (no permanent delete of financial records)