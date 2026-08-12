// student-result.js - Public-facing student result check

const API_BASE_URL = window.location.protocol === 'http:' && window.location.hostname === 'localhost' 
    ? 'http://localhost:5002/api' 
    : '/api';

let currentStudentData = null;
let currentResults = [];
let currentExamIndex = 0;

// ============================================
// 1. VERIFY STUDENT
// ============================================
async function verifyResult(event) {
    event.preventDefault();
    
    const studentId = document.getElementById('studentIdInput').value.trim();
    const phone = document.getElementById('phoneInput').value.trim();
    const btn = document.getElementById('verifyBtn');
    const errorEl = document.getElementById('errorMsg');
    
    if (!studentId || !phone) {
        showError('Please enter both Student ID and Phone Number.');
        return;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;border-top-color:white;margin-right:8px;"></span> Verifying...';
    errorEl.classList.remove('show');
    
    try {
        const response = await fetch(`${API_BASE_URL}/results/public/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, phone })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            showError(data.message || 'No matching record found. Please check your credentials.');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-search"></i> View Result';
            return;
        }
        
        currentStudentData = data.student;
        currentResults = data.results || [];
        
        if (currentResults.length === 0) {
            // Show student info with message
            showStudentInfoNoResults();
        } else {
            showResults();
        }
        
        document.getElementById('topActions').style.display = 'flex';
        document.getElementById('topActions').style.gap = '10px';
        document.getElementById('topActions').style.alignItems = 'center';
        
    } catch (error) {
        console.error('Error:', error);
        showError('Network error. Please try again later.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-search"></i> View Result';
    }
}

function showError(message) {
    const el = document.getElementById('errorMsg');
    el.textContent = message;
    el.classList.add('show');
}

// ============================================
// 2. SHOW RESULTS
// ============================================
function showResults() {
    document.getElementById('verifyForm').style.display = 'none';
    document.getElementById('resultDisplay').classList.add('show');
    document.getElementById('pageHeader').style.display = 'none';
    
    renderResult(0);
    
    // Create exam selector if multiple exams
    if (currentResults.length > 1) {
        let selectorHTML = '<div style="display:flex; gap:8px; padding:15px 30px; overflow-x:auto; background:#f8f9fc; border-bottom:1px solid #e3e6f0;">';
        currentResults.forEach((r, i) => {
            const examName = r.examId?.name || `Exam ${i+1}`;
            selectorHTML += `<button class="exam-btn ${i === 0 ? 'active' : ''}" onclick="selectExam(${i})" style="
                padding:8px 16px; border:2px solid #e3e6f0; border-radius:20px; background:${i === 0 ? '#4e73df' : 'white'};
                color:${i === 0 ? 'white' : '#333'}; cursor:pointer; font-size:12px; white-space:nowrap;
                transition:all 0.2s; font-weight:${i === 0 ? '600' : '400'};
            ">${examName}</button>`;
        });
        selectorHTML += '</div>';
        
        // Insert selector after header
        const cardWrap = document.getElementById('resultCardWrap');
        const header = document.getElementById('resultHeader');
        header.insertAdjacentHTML('afterend', selectorHTML);
    }
    
    // Scroll to result
    document.getElementById('resultDisplay').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function selectExam(index) {
    currentExamIndex = index;
    renderResult(index);
    
    // Update active button
    document.querySelectorAll('.exam-btn').forEach((btn, i) => {
        btn.style.background = i === index ? '#4e73df' : 'white';
        btn.style.color = i === index ? 'white' : '#333';
        btn.style.fontWeight = i === index ? '600' : '400';
    });
}

function renderResult(index) {
    const result = currentResults[index];
    if (!result) return;
    
    const exam = result.examId || {};
    const student = currentStudentData;
    
    // Header
    document.getElementById('resultHeader').innerHTML = `
        <div class="result-header">
            <h2>📄 ${exam.name || 'Exam Result'}</h2>
            <p>${exam.examType?.replace('_', ' ') || ''} | ${exam.batch || student.batch} | ${exam.date ? new Date(exam.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
        </div>
    `;
    
    // Student Info
    let photoHtml = '';
    if (student.photo) {
        photoHtml = `<img src="${student.photo}" alt="${student.name}">`;
    }
    document.getElementById('studentInfo').innerHTML = `
        ${photoHtml}
        <div>
            <h3>${student.name}</h3>
            <p>ID: ${student.studentId} ${student.roll ? '| Roll: ' + student.roll : ''} | ${student.batch} ${student.guardianName ? '| Guardian: ' + student.guardianName : ''}</p>
        </div>
    `;
    
    // Summary
    const posColor = result.percentage >= 40 ? 'green' : 'red';
    document.getElementById('summaryGrid').innerHTML = `
        <div class="item">
            <div class="label">Total</div>
            <div class="value blue">${result.totalMarks}/${result.totalFullMarks}</div>
        </div>
        <div class="item">
            <div class="label">Percentage</div>
            <div class="value ${posColor}">${result.percentage?.toFixed(2) || '0'}%</div>
        </div>
        <div class="item">
            <div class="label">Grade</div>
            <div class="value gold">${result.grade || 'N/A'}</div>
        </div>
        <div class="item">
            <div class="label">Grade Point</div>
            <div class="value">${result.gradePoint?.toFixed(2) || '0.00'}</div>
        </div>
        <div class="item">
            <div class="label">Position</div>
            <div class="value gold">${result.position || '-'}/${result.totalParticipants || '?'}</div>
        </div>
        <div class="item">
            <div class="label">Status</div>
            <div class="value green">Published</div>
        </div>
    `;
    
    // Batch Comparison
    document.getElementById('batchCompare').innerHTML = `
        <span><strong>Your Score:</strong> ${result.percentage?.toFixed(1) || '0'}%</span>
        <span><strong>Batch Average:</strong> ${result.batchAverage?.toFixed(1) || '0'}%</span>
        <span style="color: ${(result.percentage || 0) >= (result.batchAverage || 0) ? '#1cc88a' : '#e74a3b'}">
            ${(result.percentage || 0) >= (result.batchAverage || 0) ? '⬆ Above Average' : '⬇ Below Average'}
        </span>
    `;
    
    // Subject Breakdown
    let subjectHtml = `<h3><i class="fas fa-book-open"></i> Subject-wise Marks</h3>
        <table class="subject-table">
            <thead>
                <tr>
                    <th>Subject</th>
                    <th>Marks</th>
                    <th>Out of</th>
                    <th>%</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>`;
    
    (result.subjects || []).forEach(sub => {
        const subPercent = sub.fullMark > 0 ? (sub.mark / sub.fullMark) * 100 : 0;
        let status = '';
        if (subPercent >= 80) status = '<span class="strength-badge strong">Excellent</span>';
        else if (subPercent >= 60) status = '<span class="strength-badge average">Good</span>';
        else if (subPercent >= 40) status = '<span class="strength-badge average">Pass</span>';
        else status = '<span class="strength-badge weak">Fail</span>';
        
        subjectHtml += `
            <tr>
                <td class="subject-name">${sub.subject}</td>
                <td><strong>${sub.mark}</strong></td>
                <td>${sub.fullMark}</td>
                <td>${subPercent.toFixed(1)}%</td>
                <td>${status}</td>
            </tr>`;
    });
    
    subjectHtml += '</tbody></table>';
    document.getElementById('subjectSection').innerHTML = subjectHtml;
    
    // Strength & Weakness
    const subjects = (result.subjects || []).map(sub => ({
        ...sub,
        percent: sub.fullMark > 0 ? (sub.mark / sub.fullMark) * 100 : 0
    }));
    const strong = subjects.filter(s => s.percent >= 70);
    const weak = subjects.filter(s => s.percent < 60);
    
    if (strong.length > 0 || weak.length > 0) {
        let swHtml = '<h4><i class="fas fa-chart-bar"></i> Subject Analysis</h4><div class="sw-grid">';
        if (strong.length > 0) {
            swHtml += `<div style="background:#e8f5e9; padding:12px; border-radius:8px;">
                <p style="font-weight:600; color:#2e7d32; margin-bottom:5px;">✅ Strengths</p>
                ${strong.map(s => `<span class="strength-badge strong">${s.subject} (${s.percent.toFixed(0)}%)</span>`).join(' ')}
            </div>`;
        }
        if (weak.length > 0) {
            swHtml += `<div style="background:#fce4ec; padding:12px; border-radius:8px;">
                <p style="font-weight:600; color:#c62828; margin-bottom:5px;">⚠️ Needs Improvement</p>
                ${weak.map(s => `<span class="strength-badge weak">${s.subject} (${s.percent.toFixed(0)}%)</span>`).join(' ')}
            </div>`;
        }
        swHtml += '</div>';
        document.getElementById('swSection').innerHTML = swHtml;
        document.getElementById('swSection').style.display = 'block';
    } else {
        document.getElementById('swSection').style.display = 'none';
    }
    
    // Remarks
    if (result.remarks) {
        document.getElementById('remarksSection').innerHTML = `
            <h4><i class="fas fa-comment"></i> Teacher's Remarks</h4>
            <p>"${result.remarks}"</p>
        `;
        document.getElementById('remarksSection').style.display = 'block';
    } else {
        document.getElementById('remarksSection').style.display = 'none';
    }
    
    // Progress Chart (if multiple results)
    if (currentResults.length > 1) {
        const sortedResults = [...currentResults].sort((a, b) => 
            new Date(a.examId?.date || 0) - new Date(b.examId?.date || 0)
        );
        
        document.getElementById('progressSection').innerHTML = `
            <h3><i class="fas fa-chart-line"></i> Progress Over Exams</h3>
            <canvas id="progressChart" height="200"></canvas>
        `;
        
        setTimeout(() => {
            const ctx = document.getElementById('progressChart');
            if (!ctx) return;
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: sortedResults.map(r => r.examId?.name || 'Exam'),
                    datasets: [{
                        label: 'Your %',
                        data: sortedResults.map(r => r.percentage),
                        borderColor: '#4e73df',
                        backgroundColor: 'rgba(78,115,223,0.1)',
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: '#4e73df',
                        pointRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { min: 0, max: 100, ticks: { callback: v => v + '%' } }
                    }
                }
            });
        }, 200);
    } else {
        document.getElementById('progressSection').style.display = 'none';
    }
}

// ============================================
// 3. NO RESULTS
// ============================================
function showStudentInfoNoResults() {
    const student = currentStudentData;
    
    document.getElementById('verifyForm').style.display = 'none';
    document.getElementById('resultDisplay').classList.add('show');
    document.getElementById('pageHeader').style.display = 'none';
    
    const photoUrl = student.photo || '';
    
    document.getElementById('resultHeader').innerHTML = `
        <div class="result-header">
            <h2>👋 Welcome, ${student.name}!</h2>
            <p>No published results found yet. Please check back later.</p>
        </div>
    `;
    
    document.getElementById('studentInfo').innerHTML = `
        <img src="${photoUrl}" alt="${student.name}">
        <div>
            <h3>${student.name}</h3>
            <p>ID: ${student.studentId} | ${student.batch} | ${student.phone}</p>
        </div>
    `;
    
    document.getElementById('summaryGrid').innerHTML = '';
    document.getElementById('batchCompare').innerHTML = '';
    document.getElementById('subjectSection').innerHTML = '';
    document.getElementById('swSection').style.display = 'none';
    document.getElementById('remarksSection').style.display = 'none';
    document.getElementById('progressSection').style.display = 'none';
    
    document.getElementById('topActions').style.display = 'flex';
}

// ============================================
// 4. NAVIGATION
// ============================================
function showVerifyForm() {
    document.getElementById('verifyForm').style.display = 'block';
    document.getElementById('resultDisplay').classList.remove('show');
    document.getElementById('pageHeader').style.display = 'block';
    document.getElementById('topActions').style.display = 'none';
    document.getElementById('errorMsg').classList.remove('show');
    
    // Clear inputs
    document.getElementById('studentIdInput').value = '';
    document.getElementById('phoneInput').value = '';
}