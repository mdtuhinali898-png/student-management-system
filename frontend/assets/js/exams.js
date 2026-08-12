// exams.js - Admin Exam Management

document.addEventListener('DOMContentLoaded', () => {

    // ============================================
    // 1. CONFIG & STATE
    // ============================================
    const API_BASE_URL = window.location.protocol === 'http:' && window.location.hostname === 'localhost' 
        ? 'http://localhost:5002/api' 
        : '/api';
    let currentPage = 1;
    const ITEMS_PER_PAGE = 20;
    let examsData = [];
    let totalExams = 0;
    let totalPages = 0;

    // ============================================
    // 2. INITIALIZE
    // ============================================
    loadBatches();
    fetchExams();
    fetchStats();

    // ============================================
    // 3. API FUNCTIONS
    // ============================================
    async function fetchExams() {
        try {
            const batch = document.getElementById('filterBatch').value;
            const status = document.getElementById('filterStatus').value;
            const examType = document.getElementById('filterExamType').value;
            
            let url = `${API_BASE_URL}/exams?page=${currentPage}&limit=${ITEMS_PER_PAGE}`;
            if (batch && batch !== 'all') url += `&batch=${encodeURIComponent(batch)}`;
            if (status && status !== 'all') url += `&status=${encodeURIComponent(status)}`;
            if (examType && examType !== 'all') url += `&examType=${encodeURIComponent(examType)}`;

            const response = await fetch(url);
            const data = await response.json();
            
            examsData = data.data || [];
            totalExams = data.total || 0;
            totalPages = data.totalPages || 0;
            
            renderTable();
        } catch (error) {
            console.error('Error fetching exams:', error);
            document.getElementById('examTableBody').innerHTML = 
                `<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--danger);">Failed to load exams. Server may be offline.</td></tr>`;
        }
    }

    async function fetchStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/exams/stats/overview`);
            const result = await response.json();
            if (result.success) {
                const stats = result.data;
                document.getElementById('statTotal').innerText = stats.total || 0;
                document.getElementById('statPublished').innerText = stats.published || 0;
                document.getElementById('statDraft').innerText = stats.draft || 0;
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }

    async function loadBatches() {
        try {
            const response = await fetch(`${API_BASE_URL}/batches`);
            const result = await response.json();
            
            if (result.success && result.data) {
                const batches = result.data;
                
                // Update filter dropdown
                const filterSelect = document.getElementById('filterBatch');
                filterSelect.innerHTML = '<option value="all">All Batch</option>';
                
                // Update modal dropdown
                const modalSelect = document.getElementById('examBatch');
                modalSelect.innerHTML = '<option value="">Select Batch</option>';
                
                batches.forEach(batch => {
                    const opt1 = document.createElement('option');
                    opt1.value = batch.name;
                    opt1.textContent = batch.name;
                    filterSelect.appendChild(opt1);
                    
                    const opt2 = document.createElement('option');
                    opt2.value = batch.name;
                    opt2.textContent = batch.name;
                    modalSelect.appendChild(opt2);
                });
            }
        } catch (error) {
            console.error('Error loading batches:', error);
        }
    }

    // ============================================
    // 4. RENDER TABLE
    // ============================================
    function renderTable() {
        const tbody = document.getElementById('examTableBody');
        
        if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
        
        tbody.innerHTML = '';

        if (examsData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#888;">No exams found. Create your first exam!</td></tr>`;
            document.getElementById('resultCount').innerText = `Total: 0 Exams`;
            document.getElementById('paginationContainer').innerHTML = '';
            return;
        }

        examsData.forEach(exam => {
            const typeClass = `exam-type-${exam.examType}`;
            const statusClass = exam.status === 'published' ? 'status-published' : 'status-draft';
            const date = new Date(exam.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            
            const subjectsHtml = (exam.subjects || []).map(s => {
                const markBreakdown = exam.questionType === 'both'
                    ? `MCQ ${s.mcqMark || 0} + CQ ${s.cqMark || 0}`
                    : `${exam.questionType === 'cq' ? 'CQ' : 'MCQ'} ${s.fullMark}`;
                return `<span class="subject-tag">${s.name} (${markBreakdown})</span>`;
            }
            ).join('') || '<span class="subject-tag">N/A</span>';

            let actionsHtml = '';
            if (exam.status === 'draft') {
                actionsHtml = `
                    <button class="btn-enter-marks" onclick="window.location.href='mark-entry.html?examId=${exam._id}'"><i class="fas fa-edit"></i> Enter Marks</button>
                    <button class="btn-publish" onclick="publishExam('${exam._id}')"><i class="fas fa-check"></i> Publish</button>
                    <button class="btn-view-results" onclick="window.location.href='view-result.html?examId=${exam._id}'"><i class="fas fa-eye"></i> View</button>
                `;
            } else {
                actionsHtml = `
                    <button class="btn-draft" onclick="draftExam('${exam._id}')"><i class="fas fa-undo"></i> Draft</button>
                    <button class="btn-view-results" onclick="window.location.href='view-result.html?examId=${exam._id}'"><i class="fas fa-eye"></i> View</button>
                `;
            }

            const row = `
                <tr>
                    <td><strong>${exam.name}</strong></td>
                    <td><span class="exam-type-badge ${typeClass}">${exam.examType.replace('_', ' ')}</span></td>
                    <td>${date}</td>
                    <td>${exam.batch}</td>
                    <td><div class="subject-tags">${subjectsHtml}</div></td>
                    <td><span class="status-badge ${statusClass}">${exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}</span></td>
                    <td>
                        <div class="exam-actions">
                            ${actionsHtml}
                            <button class="btn-edit" onclick="editExam('${exam._id}')" style="background:var(--purple);color:white;padding:5px 10px;border:none;border-radius:4px;cursor:pointer;font-size:12px;"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="deleteExam('${exam._id}')" style="background:var(--danger);color:white;padding:5px 10px;border:none;border-radius:4px;cursor:pointer;font-size:12px;"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        document.getElementById('resultCount').innerText = `Total: ${totalExams} Exams`;
        renderPagination();
    }

    function renderPagination() {
        const container = document.getElementById('paginationContainer');
        container.innerHTML = '';

        if (totalPages <= 1) return;

        container.innerHTML += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">Prev</button>`;

        const maxVisible = 7;
        let startPage = 1;
        let endPage = totalPages;

        if (totalPages > maxVisible) {
            const half = Math.floor(maxVisible / 2);
            if (currentPage <= half + 1) {
                startPage = 1;
                endPage = maxVisible;
            } else if (currentPage >= totalPages - half) {
                startPage = totalPages - maxVisible + 1;
                endPage = totalPages;
            } else {
                startPage = currentPage - half;
                endPage = currentPage + half;
            }
        }

        if (startPage > 1) {
            container.innerHTML += `<button class="page-btn" onclick="changePage(1)">1</button>`;
            if (startPage > 2) container.innerHTML += `<span class="page-ellipsis">...</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            container.innerHTML += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) container.innerHTML += `<span class="page-ellipsis">...</span>`;
            container.innerHTML += `<button class="page-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
        }

        container.innerHTML += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Next</button>`;
    }

    // ============================================
    // 5. EVENT HANDLERS (Global)
    // ============================================
    window.changePage = (page) => {
        currentPage = page;
        fetchExams();
    };

    // Filter events
    document.getElementById('filterBatch').addEventListener('change', () => { currentPage = 1; fetchExams(); });
    document.getElementById('filterStatus').addEventListener('change', () => { currentPage = 1; fetchExams(); });
    document.getElementById('filterExamType').addEventListener('change', () => { currentPage = 1; fetchExams(); });

    // Sidebar toggle (use sidebarToggle if available, fallback to menuToggle)
    const sidebarToggle = document.getElementById('sidebarToggle');
    const menuToggle = document.getElementById('menuToggle');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
        });
    } else if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
        });
    }

    // ============================================
    // 6. EXAM MODAL FUNCTIONS (Global for onclick)
    // ============================================
    window.openCreateExamModal = () => {
        document.getElementById('modalTitle').innerText = 'Create New Exam';
        document.getElementById('examForm').reset();
        document.getElementById('examId').value = '';
        // Set default date
        document.getElementById('examDate').value = new Date().toISOString().split('T')[0];
        document.querySelector('input[name="questionType"][value="mcq"]').checked = true;
        const container = document.getElementById('subjectRows');
        container.innerHTML = '';
        ['Bangla', 'English', 'Mathematics'].forEach(subjectName => addSubjectRow({ name: subjectName, mcqMark: 100, cqMark: 0 }));
        updateQuestionTypeUI();
        document.getElementById('examModal').classList.add('active');
    };

    window.closeExamModal = () => {
        document.getElementById('examModal').classList.remove('active');
    };

    window.editExam = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/exams/${id}`);
            const result = await response.json();
            if (!result.success) {
                alert('Failed to load exam data');
                return;
            }
            const exam = result.data;
            
            document.getElementById('modalTitle').innerText = 'Edit Exam';
            document.getElementById('examId').value = exam._id;
            document.getElementById('examName').value = exam.name;
            document.getElementById('examType').value = exam.examType;
            document.getElementById('examDate').value = new Date(exam.date).toISOString().split('T')[0];
            document.getElementById('examBatch').value = exam.batch;
            document.getElementById('examDescription').value = exam.description || '';
            const questionType = exam.questionType || 'mcq';
            document.querySelector(`input[name="questionType"][value="${questionType}"]`).checked = true;
            
            // Load subjects
            const container = document.getElementById('subjectRows');
            container.innerHTML = '';
            exam.subjects.forEach(sub => {
                addSubjectRow({
                    name: sub.name,
                    mcqMark: sub.mcqMark ?? (questionType === 'mcq' ? sub.fullMark : 0),
                    cqMark: sub.cqMark ?? (questionType === 'cq' ? sub.fullMark : 0)
                });
            });
            updateQuestionTypeUI();
            
            document.getElementById('examModal').classList.add('active');
        } catch (error) {
            console.error('Error loading exam:', error);
            alert('Failed to load exam data');
        }
    };

    window.saveExam = async (event) => {
        event.preventDefault();
        
        const examId = document.getElementById('examId').value;
        const name = document.getElementById('examName').value.trim();
        const examType = document.getElementById('examType').value;
        const questionType = document.querySelector('input[name="questionType"]:checked').value;
        const date = document.getElementById('examDate').value;
        const batch = document.getElementById('examBatch').value;
        const description = document.getElementById('examDescription').value.trim();
        
        if (!batch) {
            alert('Please select a batch/class');
            return;
        }
        
        // Collect subjects
        const subjectRows = document.querySelectorAll('.subject-row');
        const subjects = [];
        let valid = true;
        
        subjectRows.forEach((row, index) => {
            const nameInput = row.querySelector('.subject-name-input');
            const subName = nameInput.value.trim();
            const mcqMark = parseFloat(row.querySelector('.mcq-mark-input').value) || 0;
            const cqMark = parseFloat(row.querySelector('.cq-mark-input').value) || 0;
            const fullMark = mcqMark + cqMark;
            
            if (!subName) {
                alert(`Subject name is required for subject ${index + 1}`);
                valid = false;
                return;
            }
            if ((questionType === 'both' && (!mcqMark || !cqMark)) || !fullMark || fullMark < 1) {
                alert(questionType === 'both'
                    ? `Enter both MCQ and CQ marks for subject: ${subName}`
                    : `Valid full marks required for subject: ${subName}`);
                valid = false;
                return;
            }
            subjects.push({ name: subName, fullMark, mcqMark, cqMark });
        });
        
        if (!valid || subjects.length === 0) {
            if (subjects.length === 0) alert('Please add at least one subject');
            return;
        }
        
        const btn = document.getElementById('saveExamBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Saving...';
        
        try {
            const url = examId ? `${API_BASE_URL}/exams/${examId}` : `${API_BASE_URL}/exams`;
            const method = examId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, examType, questionType, date, batch, subjects, description })
            });
            
            const result = await response.json();
            
            if (result.success) {
                closeExamModal();
                fetchExams();
                fetchStats();
                alert(examId ? 'Exam updated successfully!' : 'Exam created successfully!');
            } else {
                alert(result.message || 'Failed to save exam');
            }
        } catch (error) {
            console.error('Error saving exam:', error);
            alert('Failed to save exam. Please try again.');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Save Exam';
        }
    };

    window.addSubject = () => {
        const questionType = document.querySelector('input[name="questionType"]:checked').value;
        addSubjectRow({ name: '', mcqMark: questionType === 'cq' ? 0 : 100, cqMark: questionType === 'mcq' ? 0 : 100 });
        updateQuestionTypeUI();
    };

    function addSubjectRow({ name = '', mcqMark = 0, cqMark = 0 }) {
        const container = document.getElementById('subjectRows');
        const row = document.createElement('div');
        row.className = 'subject-row';
        row.innerHTML = `
            <input type="text" class="subject-name-input" placeholder="e.g. Science" value="${name}">
            <div class="subject-marks-inputs">
                <input type="number" class="subject-mark-input mcq-mark-input" placeholder="MCQ mark" value="${mcqMark}" min="0" oninput="updateSubjectTotal(this)">
                <input type="number" class="subject-mark-input cq-mark-input" placeholder="CQ mark" value="${cqMark}" min="0" oninput="updateSubjectTotal(this)">
                <span class="subject-total-mark">Full: ${mcqMark + cqMark}</span>
            </div>
            <button type="button" class="btn-remove-subject" onclick="removeSubject(this)">&times;</button>
        `;
        container.appendChild(row);
    }

    window.changeQuestionType = () => updateQuestionTypeUI();

    window.updateSubjectTotal = (input) => {
        const row = input.closest('.subject-row');
        const mcqMark = parseFloat(row.querySelector('.mcq-mark-input').value) || 0;
        const cqMark = parseFloat(row.querySelector('.cq-mark-input').value) || 0;
        row.querySelector('.subject-total-mark').textContent = `Full: ${mcqMark + cqMark}`;
    };

    function updateQuestionTypeUI() {
        const questionType = document.querySelector('input[name="questionType"]:checked').value;
        const help = document.getElementById('questionTypeHelp');
        help.textContent = questionType === 'both'
            ? 'Enter MCQ and CQ marks separately. Their total becomes the subject full mark.'
            : `Set the full mark for each subject's ${questionType.toUpperCase()}.`;

        document.querySelectorAll('.subject-row').forEach(row => {
            const mcqInput = row.querySelector('.mcq-mark-input');
            const cqInput = row.querySelector('.cq-mark-input');
            mcqInput.classList.toggle('is-hidden', questionType === 'cq');
            cqInput.classList.toggle('is-hidden', questionType === 'mcq');
            if (questionType === 'mcq') cqInput.value = 0;
            if (questionType === 'cq') mcqInput.value = 0;
            updateSubjectTotal(mcqInput);
        });
    }

    window.removeSubject = (btn) => {
        const rows = document.querySelectorAll('.subject-row');
        if (rows.length <= 1) {
            alert('You need at least one subject');
            return;
        }
        btn.closest('.subject-row').remove();
    };

    // ============================================
    // 7. PUBLISH / DRAFT / DELETE
    // ============================================
    window.publishExam = async (examId) => {
        if (!confirm('Are you sure you want to publish all results for this exam? Students will be able to see their results.')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/results/publish/${examId}`, {
                method: 'POST'
            });
            const result = await response.json();
            
            if (result.success) {
                alert(result.message);
                fetchExams();
                fetchStats();
            } else {
                alert('Failed to publish results');
            }
        } catch (error) {
            console.error('Error publishing:', error);
            alert('Failed to publish results');
        }
    };

    window.draftExam = async (examId) => {
        if (!confirm('Revert results to draft? Students will no longer see these results.')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/results/draft/${examId}`, {
                method: 'POST'
            });
            const result = await response.json();
            
            if (result.success) {
                alert(result.message);
                fetchExams();
                fetchStats();
            } else {
                alert('Failed to revert to draft');
            }
        } catch (error) {
            console.error('Error reverting:', error);
            alert('Failed to revert to draft');
        }
    };

    window.deleteExam = async (examId) => {
        if (!confirm('Are you sure you want to delete this exam? All results for this exam will also be deleted. This cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/exams/${examId}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            
            if (result.success) {
                alert(result.message);
                fetchExams();
                fetchStats();
            } else {
                alert('Failed to delete exam');
            }
        } catch (error) {
            console.error('Error deleting exam:', error);
            alert('Failed to delete exam');
        }
    };

});
