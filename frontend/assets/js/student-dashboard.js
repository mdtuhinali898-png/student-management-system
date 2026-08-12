document.addEventListener('DOMContentLoaded', async () => {
  const token = sessionStorage.getItem('studentPortalToken');
  if (!token) return window.location.replace('login.html');
  const apiBase = window.location.protocol === 'http:' && window.location.hostname === 'localhost' ? 'http://localhost:5002/api' : '/api';
  document.getElementById('logoutBtn').onclick = () => { sessionStorage.removeItem('studentPortalToken'); sessionStorage.removeItem('studentPortalStudent'); window.location.href = '/'; };
  try {
    const response = await fetch(`${apiBase}/student-portal/overview`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message);
    renderDashboard(data);
  } catch (error) { sessionStorage.removeItem('studentPortalToken'); alert(error.message || 'Profile load করা যায়নি।'); window.location.replace('login.html'); }
});
function money(value){return `৳ ${Number(value||0).toLocaleString('en-BD')}`}
function esc(value){return String(value||'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderDashboard(data){
 const {student,results,payments,summary}=data; const initials=student.name.split(' ').map(n=>n[0]).slice(0,2).join('');
 document.getElementById('studentAvatar').textContent=initials; document.getElementById('studentName').textContent=student.name; document.getElementById('headerStudentName').textContent=student.name; document.getElementById('studentMeta').textContent=`${student.studentId} · ${student.batch}${student.roll?` · Roll ${student.roll}`:''}`;
 document.getElementById('averageScore').textContent=summary.resultCount?`${summary.averagePercentage.toFixed(1)}%`:'—'; document.getElementById('resultCount').textContent=summary.resultCount; document.getElementById('totalPaid').textContent=money(summary.totalPaid); document.getElementById('latestGrade').textContent=summary.latestResult?.grade||'—';
 document.getElementById('resultList').innerHTML=results.length?results.slice(0,5).map(r=>`<div class="result-row"><div><strong>${esc(r.examId?.name||'Exam Result')}</strong><small>${r.examId?.date?new Date(r.examId.date).toLocaleDateString('en-GB'):''} · Position: ${esc(r.position||'—')}</small></div><div><span class="score">${Number(r.percentage||0).toFixed(1)}%</span><span class="grade">${esc(r.grade||'—')}</span></div></div>`).join(''):'<p class="empty">এখনও কোনো published result নেই।</p>';
 document.getElementById('paymentList').innerHTML=payments.length?payments.slice(0,5).map(p=>`<div class="payment-row"><div><strong>${esc(p.month)} ${esc(p.year)}</strong><small>${esc(p.receiptNo||'Payment')} · ${esc(p.paymentMethod)}</small></div><div><strong>${money(p.amount)}</strong><small>${esc(p.status)}</small></div></div>`).join(''):'<p class="empty">এখনও কোনো payment record নেই।</p>';
 const fields=[['Student ID',student.studentId],['Batch',student.batch],['Roll',student.roll],['Phone',student.phone],['Guardian',student.guardianName],['Guardian Phone',student.guardianPhone],['Group',student.group],['Address',student.address]];
 document.getElementById('profileDetails').innerHTML=fields.map(([label,value])=>`<div><span>${label}</span><strong>${esc(value)}</strong></div>`).join('');
}
