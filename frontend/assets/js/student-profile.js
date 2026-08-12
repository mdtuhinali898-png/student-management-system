// assets/js/student-profile.js

document.addEventListener('DOMContentLoaded', async () => {
    
// ============================================
// 1. CONFIG & STATE
// ============================================
const API_BASE_URL = 'http://localhost:5002/api';
const STUDENTS_KEY = 'erp_students_data';
const PAYMENTS_KEY = 'erp_payments_data';
    
let studentsData = [];
let paymentsData = [];
let currentStudent = null;
let studentPayments = [];

// ============================================
// 2. DATA LOADING
// ============================================
async function loadData() {
    try {
        // Load students from API
        const studentsResponse = await fetch(`${API_BASE_URL}/students?limit=1000`);
        const studentsDataObj = await studentsResponse.json();
        studentsData = studentsDataObj.students || [];
        
        // Load payments from API
        const paymentsResponse = await fetch(`${API_BASE_URL}/payments?limit=1000`);
        const paymentsDataObj = await paymentsResponse.json();
        paymentsData = paymentsDataObj.payments || [];
    } catch (error) {
        console.error('Error loading data from API:', error);
        // Fallback to localStorage
        studentsData = JSON.parse(localStorage.getItem(STUDENTS_KEY)) || [];
        paymentsData = JSON.parse(localStorage.getItem(PAYMENTS_KEY)) || [];
    }
}

    // ============================================
    // 3. GET STUDENT ID FROM URL
    // ============================================
    function getStudentIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    // ============================================
    // 4. FIND STUDENT DATA
    // ============================================
    function findStudent(studentId) {
            if (!studentId) return undefined;
            const normalized = String(studentId).toLowerCase();
            return studentsData.find(s =>
                String(s.studentId || '').toLowerCase() === normalized ||
                String(s._id || '').toLowerCase() === normalized ||
                String(s.id || '').toLowerCase() === normalized
            );
        }

    // ============================================
    // 5. POPULATE PROFILE
    // ============================================
    function populateProfile(student) {
        if (!student) {
            alert('Student not found!');
            window.location.href = 'students.html';
            return;
        }

        currentStudent = student;

        // Header Info
        const profilePhotoEl = document.getElementById('profilePhoto');
        const photoContainer = document.getElementById('profilePhotoContainer');
        const profileCover = document.querySelector('.profile-cover');
        
        if (student.photo) {
            profilePhotoEl.src = student.photo;
            profilePhotoEl.style.display = 'block';
            if (photoContainer) {
                photoContainer.style.display = 'block';
                photoContainer.classList.add('visible');
            }
            if (profileCover) {
                profileCover.style.display = 'block';
                profileCover.classList.add('visible');
            }
        } else {
            profilePhotoEl.style.display = 'none';
            if (photoContainer) {
                photoContainer.classList.remove('visible');
                photoContainer.classList.add('hidden');
            }
            if (profileCover) {
                profileCover.classList.remove('visible');
                profileCover.classList.add('hidden');
            }
        }
        document.getElementById('profileName').innerText = student.name || '--';
        document.getElementById('profileId').innerText = student.studentId;
        document.getElementById('profileBatch').innerText = student.batch || '--';
        document.getElementById('profilePhone').innerText = student.phone || '--';
        document.getElementById('profileAdmission').innerText = student.admissionDate 
            ? formatDate(student.admissionDate) 
            : '--';
        
        // Status Badge
        const statusBadge = document.getElementById('statusBadge');
        statusBadge.innerText = student.status || 'Active';
        statusBadge.className = `status-indicator status-${(student.status || 'active').toLowerCase()}`;

        // Personal Info
        document.getElementById('fatherName').innerText = student.guardianName || '--';
        document.getElementById('motherName').innerText = student.motherName || '--';
        document.getElementById('dob').innerText = student.dob ? formatDate(student.dob) : '--';
        document.getElementById('gender').innerText = student.gender || '--';
        document.getElementById('address').innerText = student.address || '--';
        document.getElementById('guardian').innerText = student.guardianName 
            ? `${student.guardianName} (${student.guardianPhone || 'N/A'})` 
            : '--';

        // Academic Info
        document.getElementById('batch').innerText = student.batch || '--';
        document.getElementById('classGroup').innerText = student.group || '--';
        document.getElementById('roll').innerText = student.roll || '--';
        document.getElementById('previousSchool').innerText = student.previousSchool || '--';
        document.getElementById('monthlyFee').innerText = '৳' + (student.fee || 0);
        document.getElementById('startMonth').innerText = student.startMonth || '--';

        // Notes
        if (student.notes) {
            document.getElementById('notesCard').style.display = 'block';
            document.getElementById('notesText').innerText = student.notes;
        }
    }

    // ============================================
    // 6. LOAD PAYMENT HISTORY
    // ============================================
    function loadPaymentHistory() {
        if (!currentStudent) return;

        studentPayments = paymentsData.filter(p => p.studentId === currentStudent.studentId);
        
        const tbody = document.getElementById('paymentHistoryBody');
        tbody.innerHTML = '';
        document.getElementById('paymentCount').innerText = `${studentPayments.length} Transactions`;

        if (studentPayments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#888;">No payment history found.</td></tr>`;
            return;
        }

        studentPayments.forEach(p => {
            const statusClass = p.status === 'Paid' ? 'status-paid' : (p.status === 'Partial' ? 'status-partial' : 'status-due');
            const row = `
                <tr>
                    <td><strong>${p.receiptNo}</strong></td>
                    <td>${p.month}</td>
                    <td>৳${p.amount}</td>
                    <td>${p.paymentMethod}</td>
                    <td><span class="status-badge ${statusClass}">${p.status}</span></td>
                    <td><a href="receipt.html?receipt=${p.receiptNo}" class="btn-view-sm"><i class="fas fa-eye"></i> View</a></td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    }

    // ============================================
    // 7. UPDATE STATS
    // ============================================
    function updateStats() {
        if (!currentStudent) return;

        const totalPaid = studentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalDue = studentPayments.reduce((sum, p) => {
            const expected = (p.fee || 0) - (p.discount || 0) + (p.fine || 0);
            return sum + Math.max(0, expected - (p.amount || 0));
        }, 0);
        
        const lastPayment = studentPayments.length > 0 
            ? formatDate(studentPayments[0].date || studentPayments[0].createdAt) 
            : '--';

        document.getElementById('totalPaid').innerText = '৳' + totalPaid.toLocaleString();
        document.getElementById('totalDue').innerText = '৳' + totalDue.toLocaleString();
        document.getElementById('totalPayments').innerText = studentPayments.length;
        document.getElementById('lastPayment').innerText = lastPayment;
    }

    // ============================================
    // 8. LOAD PAYMENT CHART
    // ============================================
    function loadPaymentChart() {
        if (!currentStudent || studentPayments.length === 0) return;

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = new Array(12).fill(0);

        studentPayments.forEach(p => {
            const monthIndex = months.indexOf(p.month.substring(0, 3));
            if (monthIndex !== -1) {
                monthlyData[monthIndex] += p.amount || 0;
            }
        });

        const ctx = document.getElementById('paymentChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Payment (৳)',
                    data: monthlyData,
                    backgroundColor: 'rgba(78, 115, 223, 0.7)',
                    borderColor: '#4e73df',
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: { callback: v => '৳' + v }
                    }
                }
            }
        });
    }

    // ============================================
    // 9. HELPER FUNCTIONS
    // ============================================
    function formatDate(dateString) {
        if (!dateString) return '--';
        const date = new Date(dateString);
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-GB', options);
    }

    // ============================================
    // 10. ACTION HANDLERS
    // ============================================
    window.editStudent = () => {
        if (currentStudent) {
                const idParam = currentStudent.studentId || currentStudent.id || currentStudent._id || '';
                window.location.href = `add-student.html?edit=${encodeURIComponent(idParam)}`;
            }
        };

    window.goToPayment = () => {
        if (currentStudent) {
                const idParam = currentStudent.studentId || currentStudent.id || currentStudent._id || '';
                window.location.href = `payments.html?student=${encodeURIComponent(idParam)}`;
            }
        };

    window.printProfile = () => {
        window.print();
    };

    // ============================================
    // 11. SIDEBAR TOGGLE
    // ============================================
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
        });
    }

    // ============================================
    // 12. INITIALIZE
    // ============================================
    await loadData();

    const studentId = getStudentIdFromURL();
    if (studentId) {
        const student = findStudent(studentId);
        populateProfile(student);
        loadPaymentHistory();
        updateStats();
        loadPaymentChart();
    } else {
        // If no ID, show first student (for testing)
        if (studentsData.length > 0) {
            const student = studentsData[0];
            populateProfile(student);
            loadPaymentHistory();
            updateStats();
            loadPaymentChart();
        } else {
            alert('No student data found!');
            window.location.href = 'students.html';
        }
    }

});
