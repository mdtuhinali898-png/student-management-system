// assets/js/batch-transfer.js

document.addEventListener('DOMContentLoaded', () => {

// ============================================
// 1. CONFIG & STATE
// ============================================
const API_BASE_URL = window.location.protocol === 'http:' && window.location.hostname === 'localhost' 
    ? 'http://localhost:5002/api' 
    : '/api';

let currentStudent = null;
let batchesData = [];
let allStudentsData = [];

// DOM elements
const searchInput = document.getElementById('searchInput');
const loadingSpinner = document.getElementById('loadingSpinner');
const notFound = document.getElementById('notFound');
const studentDetailsCard = document.getElementById('studentDetailsCard');
const transferFormSection = document.getElementById('transferFormSection');
const transferSuccess = document.getElementById('transferSuccess');
const targetBatchSelect = document.getElementById('targetBatch');
const newStudentIdDisplay = document.getElementById('newStudentIdDisplay');
const transferBtn = document.getElementById('transferBtn');
const confirmModal = document.getElementById('confirmModal');

// ============================================
// 2. INITIALIZE
// ============================================
async function init() {
    await loadBatches();
    await loadAllStudents();
    setupEventListeners();
    
    // Check URL for student ID parameter
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('studentId');
    if (studentId) {
        searchInput.value = studentId;
        searchStudent();
    }
}

// ============================================
// 3. LOAD DATA
// ============================================
async function loadBatches() {
    try {
        const response = await fetch(`${API_BASE_URL}/batches`);
        const result = await response.json();
        if (result.success) {
            batchesData = result.data;
        }
    } catch (error) {
        console.error('Error loading batches:', error);
    }
}

async function loadAllStudents() {
    try {
        const response = await fetch(`${API_BASE_URL}/students?limit=5000`);
        const result = await response.json();
        if (result.success || result.students) {
            allStudentsData = result.students || result.data || [];
        }
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

// ============================================
// 4. SEARCH STUDENT
// ============================================
window.searchStudent = async function() {
    const query = searchInput.value.trim();
    if (!query) {
        alert('Please enter a Student ID or Phone Number');
        return;
    }

    // Show loading
    loadingSpinner.classList.add('active');
    studentDetailsCard.classList.remove('active');
    transferFormSection.classList.remove('active');
    transferSuccess.classList.remove('active');
    notFound.classList.remove('active');
    document.getElementById('searchBtn').disabled = true;

    try {
        // Try to find by student ID first (exact match)
        let response = await fetch(`${API_BASE_URL}/students/${encodeURIComponent(query)}`);
        let result = await response.json();

        if (!result.success) {
            // Try searching with query param
            response = await fetch(`${API_BASE_URL}/students?search=${encodeURIComponent(query)}&limit=1`);
            result = await response.json();
            
            if (result.success || result.students) {
                const students = result.students || result.data || [];
                if (students.length > 0) {
                    currentStudent = students[0];
                } else {
                    throw new Error('Student not found');
                }
            } else {
                throw new Error('Student not found');
            }
        } else {
            currentStudent = result.student;
        }

        // Show student details
        displayStudentDetails(currentStudent);
        
    } catch (error) {
        console.error('Search error:', error);
        notFound.classList.add('active');
        currentStudent = null;
    } finally {
        loadingSpinner.classList.remove('active');
        document.getElementById('searchBtn').disabled = false;
    }
};

// ============================================
// 5. DISPLAY STUDENT DETAILS
// ============================================
function displayStudentDetails(student) {
    // Header
    document.getElementById('studentNameDisplay').textContent = student.name;
    document.getElementById('studentIdDisplay').textContent = student.studentId;
    document.getElementById('currentBatchDisplay').textContent = student.batch;

    // Avatar
    const avatarContainer = document.getElementById('studentAvatarLarge');
    if (student.photo) {
        avatarContainer.innerHTML = `<img src="${student.photo}" alt="${student.name}">`;
    } else {
        avatarContainer.innerHTML = `<i class="fas fa-user-graduate"></i>`;
    }

    // Details grid
    document.getElementById('detailStudentId').textContent = student.studentId;
    document.getElementById('detailName').textContent = student.name;
    document.getElementById('detailPhone').textContent = student.phone || '-';
    document.getElementById('detailBatch').textContent = student.batch;
    document.getElementById('detailFee').textContent = student.fee ? `৳${student.fee}` : '-';
    
    const statusEl = document.getElementById('detailStatus');
    statusEl.innerHTML = `<span class="status-badge status-${student.status.toLowerCase()}">${student.status}</span>`;

    // Show details card
    studentDetailsCard.classList.add('active');
    notFound.classList.remove('active');

    // Load target batch dropdown (exclude current batch)
    populateTargetBatches(student.batch);
    
    // Show transfer form
    transferFormSection.classList.add('active');
    transferSuccess.classList.remove('active');
    
    // Reset form fields
    document.getElementById('transferFee').value = 0;
    document.getElementById('transferNotes').value = '';
    transferBtn.disabled = true;
}

// ============================================
// 6. POPULATE TARGET BATCHES
// ============================================
function populateTargetBatches(currentBatch) {
    targetBatchSelect.innerHTML = '<option value="">Select Target Batch</option>';
    
    let hasOtherBatches = false;
    
    batchesData.forEach(batch => {
        if (batch.name !== currentBatch && batch.status === 'Active') {
            const option = document.createElement('option');
            option.value = batch.name;
            option.textContent = `${batch.name} (Fee: ৳${batch.fee})`;
            targetBatchSelect.appendChild(option);
            hasOtherBatches = true;
        }
    });
    
    if (!hasOtherBatches) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No other batches available';
        option.disabled = true;
        targetBatchSelect.appendChild(option);
    }
    
    newStudentIdDisplay.textContent = '---';
    transferBtn.disabled = true;
}

// ============================================
// 7. ON TARGET BATCH CHANGE
// ============================================
window.onTargetBatchChange = function() {
    const targetBatch = targetBatchSelect.value;
    
    if (!targetBatch || !currentStudent) {
        newStudentIdDisplay.textContent = '---';
        transferBtn.disabled = true;
        return;
    }
    
    // Generate new student ID for target batch
    const newId = generateNewStudentId(targetBatch);
    newStudentIdDisplay.textContent = newId;
    
    // Enable transfer button
    transferBtn.disabled = false;
};

// ============================================
// 8. GENERATE NEW STUDENT ID
// ============================================
function generateNewStudentId(targetBatch) {
    // Count existing students in target batch (excluding current student)
    const batchStudents = allStudentsData.filter(s => s.batch === targetBatch && s.studentId !== currentStudent.studentId);
    const nextNumber = batchStudents.length + 1;
    
    // Generate prefix from batch name
    const words = targetBatch.split(' ');
    let prefix;
    if (words.length >= 2) {
        const firstPart = words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
        const lastPart = words[words.length - 1].substring(2);
        prefix = firstPart + lastPart;
    } else {
        prefix = targetBatch.substring(0, 3).toUpperCase();
    }
    
    return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
}

// ============================================
// 9. SHOW CONFIRM MODAL
// ============================================
window.showConfirmModal = function() {
    if (!currentStudent || !targetBatchSelect.value) return;
    
    const targetBatch = targetBatchSelect.value;
    const newId = newStudentIdDisplay.textContent;
    const transferFee = parseFloat(document.getElementById('transferFee').value) || 0;
    const notes = document.getElementById('transferNotes').value.trim();
    
    // Find target batch details
    const targetBatchObj = batchesData.find(b => b.name === targetBatch);
    
    const confirmDetails = document.getElementById('confirmDetails');
    confirmDetails.innerHTML = `
        <div>
            <span class="label">Student Name</span>
            <span class="value">${currentStudent.name}</span>
        </div>
        <div>
            <span class="label">Current Batch</span>
            <span class="value">${currentStudent.batch}</span>
        </div>
        <div>
            <span class="label">Current ID</span>
            <span class="value">${currentStudent.studentId}</span>
        </div>
        <div>
            <span class="label">Target Batch</span>
            <span class="value highlight">${targetBatch}</span>
        </div>
        <div>
            <span class="label">New Student ID</span>
            <span class="value highlight">${newId}</span>
        </div>
        ${targetBatchObj ? `<div><span class="label">New Fee</span><span class="value">৳${targetBatchObj.fee}</span></div>` : ''}
        <div>
            <span class="label">Transfer Fee</span>
            <span class="value">${transferFee > 0 ? '৳' + transferFee : 'None'}</span>
        </div>
        ${notes ? `<div><span class="label">Notes</span><span class="value">${notes}</span></div>` : ''}
    `;
    
    confirmModal.classList.add('active');
};

// ============================================
// 10. CLOSE CONFIRM MODAL
// ============================================
window.closeConfirmModal = function() {
    confirmModal.classList.remove('active');
};

// Close modal on outside click
confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
        closeConfirmModal();
    }
});

// ============================================
// 11. EXECUTE TRANSFER
// ============================================
window.executeTransfer = async function() {
    const targetBatch = targetBatchSelect.value;
    const transferFee = parseFloat(document.getElementById('transferFee').value) || 0;
    const notes = document.getElementById('transferNotes').value.trim();
    
    // Disable confirm button
    const confirmBtn = document.getElementById('confirmTransferBtn');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/batches/transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                studentId: currentStudent.studentId,
                targetBatch: targetBatch,
                transferFee: transferFee,
                notes: notes
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Close modal
            closeConfirmModal();
            
            // Hide transfer form, show success
            transferFormSection.classList.remove('active');
            studentDetailsCard.classList.remove('active');
            
            const data = result.data;
            document.getElementById('successDetails').innerHTML = `
                <div><strong>Student:</strong> ${data.student.name}</div>
                <div><strong>From:</strong> ${data.previousBatch} (ID: ${data.previousStudentId})</div>
                <div><strong>To:</strong> ${data.targetBatch} (ID: ${data.newStudentId})</div>
                ${transferFee > 0 ? `<div><strong>Transfer Fee:</strong> ৳${transferFee}</div>` : ''}
                <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            `;
            
            transferSuccess.classList.add('active');
        } else {
            alert('❌ Transfer failed: ' + result.message);
        }
    } catch (error) {
        console.error('Transfer error:', error);
        alert('❌ Transfer failed. Please ensure the backend server is running.');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-check"></i> Confirm Transfer';
    }
};

// ============================================
// 12. RESET
// ============================================
window.resetForm = function() {
    targetBatchSelect.value = '';
    document.getElementById('transferFee').value = 0;
    document.getElementById('transferNotes').value = '';
    newStudentIdDisplay.textContent = '---';
    transferBtn.disabled = true;
};

window.resetAll = function() {
    currentStudent = null;
    searchInput.value = '';
    searchInput.focus();
    
    studentDetailsCard.classList.remove('active');
    transferFormSection.classList.remove('active');
    transferSuccess.classList.remove('active');
    notFound.classList.remove('active');
    
    targetBatchSelect.innerHTML = '<option value="">Select Target Batch</option>';
    newStudentIdDisplay.textContent = '---';
    transferBtn.disabled = true;
    document.getElementById('transferFee').value = 0;
    document.getElementById('transferNotes').value = '';
};

// ============================================
// 13. SIDEBAR TOGGLE
// ============================================
const sidebarToggle = document.getElementById('sidebarToggle');
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });
}

// ============================================
// 14. EVENT LISTENERS
// ============================================
function setupEventListeners() {
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            searchStudent();
        }
    });
}

// ============================================
// 15. INITIALIZE
// ============================================
init();

});