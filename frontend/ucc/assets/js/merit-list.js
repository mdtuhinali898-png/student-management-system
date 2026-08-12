/* ==========================================================================
   UCC পাবনা — Merit List JS
   ========================================================================== */

/* $ is already provided by exams.js (loaded before this file) */

/* ── Grade CSS class ── */
function mlGradeClass(g) {
  const m = {'A+':'ml-grade-aplus','A':'ml-grade-a','B':'ml-grade-b','C':'ml-grade-c','D':'ml-grade-d','F':'ml-grade-f','ABS':'ml-grade-abs'};
  return m[g] || 'ml-grade-abs';
}

/* ── Position badge ── */
function mlPosBadge(pos) {
  if (!pos) return `<span class="ml-pos ml-pos-abs">ABS</span>`;
  const cls = pos===1?'ml-pos-1':pos===2?'ml-pos-2':pos===3?'ml-pos-3':'ml-pos-num';
  return `<span class="ml-pos ${cls}">${pos}</span>`;
}

/* ── Populate exam dropdown ── */
function populateExamDropdown() {
  const exams = (window.EXAM_DEMO||{}).exams||[];
  const sel   = $('mlExamSelect');
  sel.innerHTML = '<option value="">-- Exam বেছে নিন --</option>';
  exams.forEach(e => {
    sel.insertAdjacentHTML('beforeend',
      `<option value="${e.id}">${e.name} — ${e.batch} (${e.date})</option>`
    );
  });

  /* quick-access chips (Published exams only) */
  const chips = $('mlSelectorChips');
  chips.innerHTML = exams.filter(e => e.status==='Published').map(e =>
    `<span class="ml-exam-chip" data-id="${e.id}" onclick="quickSelect('${e.id}')">${e.name} · ${e.batch}</span>`
  ).join('');

  /* auto-load from URL param */
  const urlExam = new URLSearchParams(window.location.search).get('exam');
  if (urlExam) { sel.value = urlExam; loadMeritList(); }
}

/* ── Quick chip select ── */
function quickSelect(id) {
  $('mlExamSelect').value = id;
  document.querySelectorAll('.ml-exam-chip').forEach(c => c.classList.toggle('active', c.dataset.id===id));
  loadMeritList();
}

/* ── Main: Load Merit List ── */
function loadMeritList() {
  const examId = $('mlExamSelect').value;
  if (!examId) { $('mlContent').style.display='none'; $('mlActionBar').style.display='none'; $('mlEmpty').style.display='none'; return; }

  const exam    = ((window.EXAM_DEMO||{}).exams||[]).find(e => e.id===examId);
  const results = ((window.EXAM_DEMO||{}).results||[]).filter(r => r.examId===examId);

  if (!exam) return;

  if (!results.length) {
    $('mlContent').style.display    = 'none';
    $('mlActionBar').style.display  = 'none';
    $('mlEmpty').style.display      = '';
    return;
  }

  /* calculate positions */
  window.calcPositions(results, exam.total);

  /* sort: present first by position, absent last */
  const sorted = [...results]
    .sort((a,b) => {
      if (a.isAbsent && !b.isAbsent) return 1;
      if (!a.isAbsent && b.isAbsent) return -1;
      return (a.position||999) - (b.position||999);
    });

  renderExamInfo(exam);
  renderSummary(results, exam);
  renderTable(sorted, exam);
  renderFooter(exam);

  $('mlExamLabel').textContent    = `${exam.name} — ${exam.batch}`;
  $('mlContent').style.display    = '';
  $('mlActionBar').style.display  = '';
  $('mlEmpty').style.display      = 'none';

  /* sync chip active state */
  document.querySelectorAll('.ml-exam-chip').forEach(c =>
    c.classList.toggle('active', c.dataset.id===examId)
  );
}

/* ── Exam Info Card ── */
function renderExamInfo(e) {
  $('mlExamInfo').innerHTML = `
    <div>
      <h2>${e.name}</h2>
      <p>${e.batch} · ${e.subject||'—'} · ${e.date}</p>
    </div>
    <div class="ml-info-chips">
      <span class="ml-info-chip"><i class="fas fa-tag"></i> ${e.type}</span>
      <span class="ml-info-chip"><i class="fas fa-star"></i> Total: ${e.total}</span>
      ${e.pass ? `<span class="ml-info-chip"><i class="fas fa-check"></i> Pass: ${e.pass}</span>` : ''}
      ${e.duration ? `<span class="ml-info-chip"><i class="fas fa-clock"></i> ${e.duration} min</span>` : ''}
      <span class="ml-info-chip ex-badge ${e.status==='Published'?'ex-badge-published':'ex-badge-draft'}">${e.status}</span>
    </div>`;
}

/* ── Summary Cards ── */
function renderSummary(results, exam) {
  const active  = results.filter(r => !r.isAbsent);
  const absent  = results.filter(r =>  r.isAbsent).length;
  const avg     = active.length ? (active.reduce((s,r)=>s+r.obtained,0)/active.length).toFixed(1) : '—';
  const highest = active.length ? Math.max(...active.map(r=>r.obtained)) : '—';
  const lowest  = active.length ? Math.min(...active.map(r=>r.obtained)) : '—';
  const passed  = exam.pass ? active.filter(r=>r.obtained>=exam.pass).length : '—';
  const rate    = active.length ? Math.round(active.reduce((s,r)=>s+r.obtained,0)/(active.length*exam.total)*100) : 0;

  $('mlSummaryGrid').innerHTML = `
    <div class="ml-sum-card"><small>Total Appeared</small><strong>${active.length}</strong></div>
    <div class="ml-sum-card ml-sum-avg"><small>Class Average</small><strong>${avg}%</strong></div>
    <div class="ml-sum-card ml-sum-high"><small>Highest</small><strong>${highest}</strong></div>
    <div class="ml-sum-card ml-sum-low"><small>Lowest</small><strong>${lowest}</strong></div>
    <div class="ml-sum-card ml-sum-pass"><small>${exam.pass?'Passed':'—'}</small><strong style="color:#059669;">${passed}</strong></div>
    <div class="ml-sum-card"><small>Collection Rate</small><strong style="color:#4f46e5;">${rate}%</strong></div>
    <div class="ml-sum-card ml-sum-absent"><small>Absent</small><strong style="color:#f59e0b;">${absent}</strong></div>
    <div class="ml-sum-card"><small>A+ Students</small><strong style="color:#065f46;">${active.filter(r=>r.grade==='A+').length}</strong></div>
    <div class="ml-sum-card"><small>Failed</small><strong style="color:#dc2626;">${exam.pass?active.filter(r=>r.obtained<exam.pass).length:'—'}</strong></div>
    <div class="ml-sum-card"><small>Pass Rate</small><strong>${exam.pass&&active.length?Math.round(active.filter(r=>r.obtained>=exam.pass).length/active.length*100)+'%':'—'}</strong></div>`;
}

/* ── Merit Table ── */
function renderTable(sorted, exam) {
  $('mlTableBody').innerHTML = sorted.map(r => {
    const rowCls = r.isAbsent ? 'ml-row-absent' : r.position===1?'ml-row-top1':r.position===2?'ml-row-top2':r.position===3?'ml-row-top3':'';
    const statusHtml = r.isAbsent
      ? '<span class="ml-grade ml-grade-abs">Absent</span>'
      : exam.pass
        ? (r.obtained >= exam.pass
            ? '<span class="ml-pass">✓ Pass</span>'
            : '<span class="ml-fail">✗ Fail</span>')
        : '—';
    return `<tr class="${rowCls}">
      <td class="tc">${mlPosBadge(r.position)}</td>
      <td style="font-weight:800;color:#4f46e5;">${r.roll}</td>
      <td style="font-weight:600;">${r.name}</td>
      <td class="tc" style="font-weight:800;font-size:16px;">${r.isAbsent?'—':r.obtained}</td>
      <td class="tc" style="color:#64748b;">${exam.total}</td>
      <td class="tc" style="font-weight:700;">${r.isAbsent?'—':r.percentage+'%'}</td>
      <td class="tc"><span class="ml-grade ${mlGradeClass(r.grade)}">${r.grade}</span></td>
      <td class="tc">${statusHtml}</td>
    </tr>`;
  }).join('');

  /* tfoot */
  const active  = sorted.filter(r=>!r.isAbsent);
  const avg     = active.length ? (active.reduce((s,r)=>s+r.obtained,0)/active.length).toFixed(1) : '—';
  $('mlTableFoot').innerHTML = `
    <tr>
      <td colspan="3" style="text-align:right;color:#374151;">Class Average:</td>
      <td class="tc" style="color:#4f46e5;font-size:15px;">${avg}</td>
      <td></td>
      <td class="tc" style="color:#4f46e5;">${active.length?Math.round(Number(avg)/exam.total*100)+'%':'—'}</td>
      <td colspan="2"></td>
    </tr>`;
}

/* ── Print Footer ── */
function renderFooter(exam) {
  const now = new Date().toLocaleString('en-GB');
  $('mlGeneratedLine').textContent =
    `Generated: ${now} · UCC পাবনা শাখা · ${exam.name} — ${exam.batch}`;
}

/* ── Export CSV ── */
function exportMeritCSV() {
  const examId = $('mlExamSelect').value;
  if (!examId) return;
  const exam    = ((window.EXAM_DEMO||{}).exams||[]).find(e=>e.id===examId);
  const results = ((window.EXAM_DEMO||{}).results||[]).filter(r=>r.examId===examId);
  window.calcPositions(results, exam.total);

  const sorted  = [...results].sort((a,b) => (a.position||999)-(b.position||999));
  const header  = ['Position','Roll','Name','Obtained','Total Marks','%','Grade','Status'];
  const rows    = sorted.map(r => [
    r.isAbsent?'—':r.position,
    r.roll, r.name,
    r.isAbsent?'ABS':r.obtained,
    exam.total,
    r.isAbsent?'—':r.percentage+'%',
    r.grade,
    r.isAbsent?'Absent':(exam.pass?(r.obtained>=exam.pass?'Pass':'Fail'):'—')
  ]);

  const csv = [header,...rows]
    .map(row => row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','))
    .join('\n');

  const a = document.createElement('a');
  a.href  = URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}));
  a.download = `MeritList_${exam.name.replace(/\s+/g,'_')}_${exam.batch.replace(/\s+/g,'_')}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);

  const t = $('exToast');
  if (t) { t.textContent='CSV downloaded!'; t.className='ex-toast'; setTimeout(()=>t.className='ex-toast hidden',3000); }
}

/* ── WhatsApp Share ── */
function shareWhatsApp() {
  const examId = $('mlExamSelect').value;
  if (!examId) return;
  const exam    = ((window.EXAM_DEMO||{}).exams||[]).find(e=>e.id===examId);
  const results = ((window.EXAM_DEMO||{}).results||[]).filter(r=>r.examId===examId&&!r.isAbsent);
  window.calcPositions(results, exam.total);

  const top3 = [...results].sort((a,b)=>(a.position||999)-(b.position||999)).slice(0,3);
  const avg  = results.length?(results.reduce((s,r)=>s+r.obtained,0)/results.length).toFixed(1):0;

  const msg = `🏆 *${exam.name} — Merit List*\n` +
    `📚 Batch: ${exam.batch}\n📅 Date: ${exam.date}\n\n` +
    top3.map(r=>`${r.position}. ${r.name} (Roll ${r.roll}) — ${r.obtained}/${exam.total} (${r.percentage}%) — ${r.grade}`).join('\n') +
    `\n\n📊 Class Average: ${avg}%\n👥 Appeared: ${results.length}\n` +
    `— UCC পাবনা শাখা`;

  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

/* ── Sidebar ── */
function initMeritList() {
  const user = JSON.parse(sessionStorage.getItem('uccAdminUser')||'{}');
  if (user.username) $('uccAdminName').textContent = user.username;
  document.getElementById('logoutBtn')?.addEventListener('click', ()=>{
    sessionStorage.removeItem('uccAdminToken');
    window.location.href='admin-login.html';
  });

  populateExamDropdown();
}

document.addEventListener('DOMContentLoaded', initMeritList);
