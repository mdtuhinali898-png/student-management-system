// result-card.js - Student Result Card (popup/admin view)

document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = window.location.protocol === 'http:' && window.location.hostname === 'localhost' 
        ? 'http://localhost:5002/api' 
        : '/api';

    const params = new URLSearchParams(window.location.search);
    const examId = params.get('examId');
    const studentId = params.get('studentId');

    if (!examId || !studentId) {
        document.getElementById('loadingSection').innerHTML = '<p style="color:var(--danger)">Missing parameters</p>';
        return;
    }

    async function loadData() {
        try {
            // Get exam results for this student AND the specific exam result
            const [examRes, studentRes] = await Promise.all([
                fetch(`${API_BASE_URL}/results/exam/${examId}`),
                fetch(`${API_BASE_URL}/results/student/${studentId}`)
            ]);
            
            const examData = await examRes.json();
            const studentData = await studentRes.json();
            
            if (!examData.success) {
                throw new Error('Failed to load exam data');
            }
            
            const exam = examData.exam;
            const allResults = examData.results || [];
            const currentResult = allResults.find(r => r.studentId === studentId);
            
            if (!currentResult) {
                throw new Error('Result not found for this student');
            }
            
            // Get student info
            const student = examData.students.find(s => s.studentId === studentId) || {};
            
            // Render the card
            renderCard(exam, currentResult, student, allResults, studentData.data || []);
            
            document.getElementById('loadingSection').style.display = 'none';
            document.getElementById('resultContent').style.display = 'block';
            
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('loadingSection').innerHTML = 
                `<p style="color:var(--danger)"><i class="fas fa-exclamation-circle"></i> ${error.message}</p>`;
        }
    }

    function renderCard(exam, result, student, allResults, studentHistory) {
        // Header
        document.getElementById('cardHeader').innerHTML = `
            <div class="result-card-header">
                <div class="exam-name">${exam.name}</div>
                <div class="exam-meta">
                    ${exam.examType.replace('_', ' ')} | ${exam.batch} | ${new Date(exam.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
            </div>
        `;
        
        // Student Info
        document.getElementById('studentInfoBar').innerHTML = `
            <div class="student-info-bar">
                ${student.photo ? `<img src="${student.photo}" alt="${result.studentName}">` : ''}
                <div class="info">
                    <h3>${result.studentName}</h3>
                    <p>ID: ${result.studentId} ${result.roll ? '| Roll: ' + result.roll : ''} | ${exam.batch}</p>
                </div>
            </div>
        `;
        
        // Summary Grid
        const positiveClass = result.percentage >= 40 ? 'green' : 'red';
        document.getElementById('summaryGrid').innerHTML = `
            <div class="result-summary-grid">
                <div class="result-summary-item">
                    <div class="label">Total Marks</div>
                    <div class="value blue">${result.totalMarks}/${result.totalFullMarks}</div>
                </div>
                <div class="result-summary-item">
                    <div class="label">Percentage</div>
                    <div class="value ${positiveClass}">${result.percentage.toFixed(2)}%</div>
                </div>
                <div class="result-summary-item">
                    <div class="label">Grade</div>
                    <div class="value gold">${result.grade}</div>
                </div>
                <div class="result-summary-item">
                    <div class="label">Grade Point</div>
                    <div class="value purple">${result.gradePoint.toFixed(2)}</div>
                </div>
                <div class="result-summary-item">
                    <div class="label">Position</div>
                    <div class="value gold">${result.position || '-'} / ${allResults.length}</div>
                </div>
                <div class="result-summary-item">
                    <div class="label">Status</div>
                    <div class="value ${exam.status === 'published' ? 'green' : 'orange'}">${exam.status.toUpperCase()}</div>
                </div>
            </div>
        `;
        
        // Subject Breakdown
        let subjectHtml = `<div class="subject-breakdown">
            <h3><i class="fas fa-book-open"></i> Subject-wise Marks</h3>
            <table class="subject-breakdown-table">
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Marks</th>
                        <th>Out of</th>
                        <th>%</th>
                        <th>Performance</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>`;
        
        result.subjects.forEach(sub => {
            const subPercent = sub.fullMark > 0 ? (sub.mark / sub.fullMark) * 100 : 0;
            const barWidth = Math.min(subPercent, 100);
            let barClass = '';
            let strengthLabel = '';
            
            if (subPercent >= 80) { barClass = ''; strengthLabel = '<span class="strength-badge strong">Strong</span>'; }
            else if (subPercent >= 60) { barClass = 'below-avg'; strengthLabel = '<span class="strength-badge average">Average</span>'; }
            else { barClass = 'poor'; strengthLabel = '<span class="strength-badge weak">Weak</span>'; }
            
            subjectHtml += `
                <tr>
                    <td class="subject-name">${sub.subject}</td>
                    <td><strong>${sub.mark}</strong></td>
                    <td>${sub.fullMark}</td>
                    <td>${subPercent.toFixed(1)}%</td>
                    <td>
                        <div class="mark-bar">
                            <div class="mark-bar-fill ${barClass}" style="width: ${barWidth}%;"></div>
                            <small>${subPercent.toFixed(0)}%</small>
                        </div>
                    </td>
                    <td>${strengthLabel}</td>
                </tr>`;
        });
        
        subjectHtml += `</tbody></table></div>`;
        document.getElementById('subjectBreakdown').innerHTML = subjectHtml;
        
        // Strength & Weakness Analysis
        const sortedByPercent = [...result.subjects].map(sub => ({
            ...sub,
            percent: sub.fullMark > 0 ? (sub.mark / sub.fullMark) * 100 : 0
        })).sort((a, b) => b.percent - a.percent);
        
        const strong = sortedByPercent.filter(s => s.percent >= 70);
        const weak = sortedByPercent.filter(s => s.percent < 60);
        
        if (strong.length > 0 || weak.length > 0) {
            let swHtml = `<div class="strength-weakness">
                <h4><i class="fas fa-chart-bar"></i> Subject Analysis</h4>
                <div class="subject-analysis">`;
            
            if (strong.length > 0) {
                swHtml += `<div style="background:#e8f5e9; padding:12px; border-radius:8px;">
                    <p style="font-weight:600; color:#2e7d32; margin-bottom:5px;">✅ Strengths</p>
                    ${strong.map(s => `<span class="strength-badge strong" style="margin:2px; display:inline-block;">${s.subject} (${s.percent.toFixed(0)}%)</span>`).join(' ')}
                </div>`;
            }
            
            if (weak.length > 0) {
                swHtml += `<div style="background:#fce4ec; padding:12px; border-radius:8px;">
                    <p style="font-weight:600; color:#c62828; margin-bottom:5px;">⚠️ Needs Improvement</p>
                    ${weak.map(s => `<span class="strength-badge weak" style="margin:2px; display:inline-block;">${s.subject} (${s.percent.toFixed(0)}%)</span>`).join(' ')}
                </div>`;
            }
            
            swHtml += `</div></div>`;
            document.getElementById('strengthWeakness').innerHTML = swHtml;
        }
        
        // Remarks
        if (result.remarks) {
            document.getElementById('remarksSection').innerHTML = `
                <div class="remarks-section">
                    <h4><i class="fas fa-comment"></i> Teacher's Remarks</h4>
                    <p class="remarks-text">"${result.remarks}"</p>
                </div>
            `;
        }
        
        // Progress Chart (if student has multiple exams)
        if (studentHistory.length > 1) {
            const sortedHistory = [...studentHistory].sort((a, b) => new Date(a.examId?.date || 0) - new Date(b.examId?.date || 0));
            
            document.getElementById('progressSection').innerHTML = `
                <div class="progress-chart-container">
                    <h3><i class="fas fa-chart-line"></i> Progress Over Time</h3>
                    <div class="chart-wrapper">
                        <canvas id="progressChart" height="250"></canvas>
                    </div>
                </div>
            `;
            
            setTimeout(() => {
                const ctx = document.getElementById('progressChart').getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: sortedHistory.map(r => r.examId?.name || 'Unknown'),
                        datasets: [{
                            label: 'Percentage',
                            data: sortedHistory.map(r => r.percentage),
                            borderColor: '#4e73df',
                            backgroundColor: 'rgba(78,115,223,0.1)',
                            fill: true,
                            tension: 0.3,
                            pointBackgroundColor: '#4e73df',
                            pointRadius: 5
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: {
                                min: 0,
                                max: 100,
                                ticks: { callback: v => v + '%' }
                            }
                        }
                    }
                });
            }, 100);
        }
    }

    loadData();

});