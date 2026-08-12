/* ==========================================================================
   UCC পাবনা — Mark Entry JS
   ========================================================================== */

/* ── Demo students per batch ── */
const BATCH_STUDENTS = {
  'Medical-2026-A':   [{roll:'101',name:'Rahim Ahmed'},{roll:'102',name:'Karim Hossain'},{roll:'103',name:'Sumon Mia'},{roll:'104',name:'Mim Akter'},{roll:'105',name:'Tanvir Ahmed'}],
  'Medical-2026-B':   [{roll:'201',name:'Nafis Rahman'},{roll:'202',name:'Rima Khatun'},{roll:'203',name:'Sadia Islam'}],
  'Engineering-2026': [{roll:'301',name:'Arif Mahmud'},{roll:'302',name:'Jannatul Ferdous'},{roll:'303',name:'Nusrat Jahan'}],
  'Varsity-A-2026':   [{roll:'401',name:'Rakib Hassan'},{roll:'402',name:'Tasnim Rahman'},{roll:'403',name:'Liton Mia'}],
  'Varsity-B-2026':   [{roll:'501',name:'Shimul Akter'},{roll:'502',name:'Kamal Hossen'}]
};

let currentExam = null;
let entryData   = [];   /* [{ roll, name, obtained, isAbsent, remarks }] */

/* ── Helpers ── */
/* $ is already provided by exams.js (loaded before this file) */
function exToast(msg, type='success') {
  const t = $('exToast');
  if (!t) return;
  t.textContent = msg;
  t.className   = 'ex-toast' + (type==='error' ? ' error' : '');
  clearTimeout(window._meToast);
  window._meToast = setTimeout(() => t.className = 'ex-toast hidden', 3200);
}
function gradeClass(g) {
  const map = { 'A+':'me-grade-aplus','A':'me-grade-a','B':'me-grade-b','C':'me-grade-c','D':'me-grade-d','F':'me-grade-f','ABS':'me-grade-abs' };
  return map[g] || 'me-grade-abs';
}
function posClass(p) {
  if (!p) return 'me-pos me-pos-abs';
  if (p===1) return 'me-pos me-pos-1';
  if (p===2) return 'me-pos me-pos-2';
  if (p===3) return 'me-pos me-pos-3';
  return 'me-pos';
}

/* ── Step 1: Render Exam Cards ── */
function renderExamCards() {
  const grid    = $('examSelectGrid');
  const exams   = (window.EXAM_DEMO || {}).exams || [];
  const urlExam = new URLSearchParams(window.location.search).get('exam');

  if (!exams.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#64748b;">
      <i class="fas fa-clipboard-list" style="font-size:40px;opacity:.3;display:block;margin-bottom:12px;"></i>
      কোনো exam নেই। <a href="exams.html" style="color:#4f46e5;font-weight:700;">Exam তৈরি করুন।</a>
    </div>`;
    return;
  }

  grid.innerHTML = exams.map(e => {
    const cnt = ((window.EXAM_DEMO||{}).results||[]).filter(r => r.examId===e.id && !r.isAbsent).length;
    return `
      <div class="me-exam-card ${urlExam===e.id?'selected':''}" onclick="selectExam('${e.id}')">
        <span class="me-exam-card-badge ${e.status==='Draft'?'draft':''}">${e.status}</span>
        <div class="me-exam-card-name">${e.name}</div>
        <div class="me-exam-card-meta">
          <i class="fas fa-layer-group" style="color:#4f46e5;"></i> ${e.batch}<br>
          <i class="fas fa-tag" style="color:#7c3aed;"></i> ${e.type} · ${e.subject||'—'}<br>
          <i class="fas fa-calendar" style="color:#059669;"></i> ${e.date}<br>
          <i class="fas fa-users" style="color:#f59e0b;"></i> ${cnt} entries recorded
        </div>
        <div class="me-exam-card-total">Total: ${e.total} marks</div>
      </div>`;
  }).join('');

  /* auto-select from URL param */
  if (urlExam && exams.find(e => e.id===urlExam)) {
    selectExam(urlExam);
  }
}

/* ── Select Exam → go to Step 2 ── */
function selectExam(examId) {
  const exams = (window.EXAM_DEMO||{}).exams||[];
  currentExam = exams.find(e => e.id===examId);
  if (!currentExam) return;

  /* highlight card */
  document.querySelectorAll('.me-exam-card').forEach(c => c.classList.remove('selected'));
  const cards = document.querySelectorAll('.me-exam-card');
  cards.forEach(c => { if (c.onclick.toString().includes(examId)) c.classList.add('selected'); });

  /* build entry data from existing results or fresh */
  const students = BATCH_STUDENTS[currentExam.batch] || [];
  const existing = ((window.EXAM_DEMO||{}).results||[]).filter(r => r.examId===examId);

  entryData = students.map(s => {
    const ex = existing.find(r => r.roll===s.roll);
    return {
      roll: s.roll, name: s.name,
      obtained:  ex ? ex.obtained  : '',
      isAbsent:  ex ? ex.isAbsent  : false,
      remarks:   ex ? (ex.remarks||'') : ''
    };
  });

  renderExamBanner();
  renderEntryTable();
  renderEntryStats();

  $('stepSelectCard').style.display = 'none';
  $('stepResultCard').style.display  = 'none';
  $('stepEntryCard').style.display  = '';
  setTimeout(() => $('stepEntryCard').scrollIntoView({behavior:'smooth',block:'start'}), 50);
}

/* ── Exam Banner ── */
function renderExamBanner() {
  const e = currentExam;
  $('meExamBanner').innerHTML = `
    <div>
      <div class="me-exam-banner-title">${e.name}</div>
      <div class="me-exam-banner-meta">${e.batch} · ${e.subject||'—'} · ${e.date}</div>
    </div>
    <div class="me-exam-banner-chips">
      <span class="me-banner-chip"><i class="fas fa-tag"></i> ${e.type}</span>
      <span class="me-banner-chip"><i class="fas fa-star"></i> Total: ${e.total} marks</span>
      ${e.pass?`<span class="me-banner-chip"><i class="fas fa-check"></i> Pass: ${e.pass}</span>`:''}
      ${e.duration?`<span class="me-banner-chip"><i class="fas fa-clock"></i> ${e.duration} min</span>`:''}
    </div>`;
}

/* ── Entry Stats ── */
function renderEntryStats() {
  const filled  = entryData.filter(r => r.obtained!=='' && !r.isAbsent).length;
  const absent  = entryData.filter(r => r.isAbsent).length;
  const total   = entryData.length;
  const pending = total - filled - absent;

  $('meEntryStats').innerHTML = `
    <div class="me-stat-pill"><i class="fas fa-users" style="color:#4f46e5;"></i> Total: <b>${total}</b></div>
    <div class="me-stat-pill"><i class="fas fa-pen" style="color:#059669;"></i> Entered: <b style="color:#059669;">${filled}</b></div>
    <div class="me-stat-pill"><i class="fas fa-hourglass" style="color:#f59e0b;"></i> Pending: <b style="color:#f59e0b;">${pending}</b></div>
    <div class="me-stat-pill"><i class="fas fa-user-slash" style="color:#ef4444;"></i> Absent: <b style="color:#ef4444;">${absent}</b></div>`;

  $('meEnteredCount').textContent = `${filled} / ${total} entries complete`;
}

/* ── Entry Table ── */
function renderEntryTable() {
  const tbody = $('meTableBody');
  tbody.innerHTML = entryData.map((r, i) => {
    const over   = r.obtained!=='' && !r.isAbsent && Number(r.obtained) > currentExam.total;
    const filled = r.obtained!=='' && !r.isAbsent && !over;
    const inpClass = over ? 'me-mark-input over' : filled ? 'me-mark-input filled' : 'me-mark-input';
    return `<tr id="meRow-${i}" class="${r.isAbsent?'me-row-absent':''}">
      <td style="font-weight:700;color:#94a3b8;">${i+1}</td>
      <td style="font-weight:800;color:#4f46e5;">${r.roll}</td>
      <td style="font-weight:600;">${r.name}</td>
      <td>
        <input type="number"
          id="mark-${i}" class="${inpClass}"
          value="${r.isAbsent?'':r.obtained}"
          min="0" max="${currentExam.total}"
          placeholder="0 – ${currentExam.total}"
          ${r.isAbsent?'disabled':''}
          oninput="onMarkInput(${i},this)"
          onkeydown="handleKey(event,${i},'mark')"
          ${r.isAbsent?'':''}
        >
      </td>
      <td>
        <label class="me-absent-wrap">
          <input type="checkbox" id="abs-${i}" ${r.isAbsent?'checked':''}
            onchange="onAbsentChange(${i},this)">
          <span class="me-absent-label">Absent</span>
        </label>
      </td>
      <td>
        <input type="text" id="rem-${i}" class="me-remarks-input"
          value="${r.remarks||''}" placeholder="Optional..."
          onkeydown="handleKey(event,${i},'rem')"
          oninput="entryData[${i}].remarks=this.value">
      </td>
    </tr>`;
  }).join('');
}

/* ── Input handler ── */
function onMarkInput(i, el) {
  const val = el.value === '' ? '' : parseFloat(el.value);
  entryData[i].obtained = val;
  if (val !== '' && val > currentExam.total) {
    el.className = 'me-mark-input over';
  } else if (val !== '') {
    el.className = 'me-mark-input filled';
  } else {
    el.className = 'me-mark-input';
  }
  renderEntryStats();
}

/* ── Absent toggle ── */
function onAbsentChange(i, el) {
  entryData[i].isAbsent = el.checked;
  const markEl = $(`mark-${i}`);
  const row    = $(`meRow-${i}`);
  if (el.checked) {
    entryData[i].obtained = 0;
    markEl.value    = '';
    markEl.disabled = true;
    markEl.className = 'me-mark-input';
    row.classList.add('me-row-absent');
  } else {
    markEl.disabled = false;
    markEl.value    = '';
    entryData[i].obtained = '';
    row.classList.remove('me-row-absent');
  }
  renderEntryStats();
}

/* ── Enter/Tab navigation ── */
function handleKey(e, i, field) {
  if (e.key === 'Enter' || e.key === 'Tab') {
    e.preventDefault();
    const next = i + 1;
    if (next < entryData.length) {
      const target = field === 'mark' ? `rem-${i}` : `mark-${next}`;
      const el = $(target);
      if (el && !el.disabled) el.focus();
    }
  }
}

/* ── Bulk actions ── */
function markAllAbsent() {
  entryData.forEach((r, i) => {
    r.isAbsent = true; r.obtained = 0;
    const cb = $(`abs-${i}`);
    const mk = $(`mark-${i}`);
    if (cb) cb.checked = true;
    if (mk) { mk.disabled = true; mk.value = ''; mk.className = 'me-mark-input'; }
    $(`meRow-${i}`)?.classList.add('me-row-absent');
  });
  renderEntryStats();
  exToast('সবাইকে Absent করা হয়েছে।');
}

function clearAllMarks() {
  entryData.forEach((r, i) => {
    r.obtained = ''; r.isAbsent = false; r.remarks = '';
    const cb = $(`abs-${i}`);
    const mk = $(`mark-${i}`);
    const rm = $(`rem-${i}`);
    if (cb) cb.checked = false;
    if (mk) { mk.disabled = false; mk.value = ''; mk.className = 'me-mark-input'; }
    if (rm) rm.value = '';
    $(`meRow-${i}`)?.classList.remove('me-row-absent');
  });
  renderEntryStats();
  exToast('সব marks clear হয়েছে।');
}

/* ── Validate ── */
function validateEntries() {
  for (let i = 0; i < entryData.length; i++) {
    const r = entryData[i];
    if (!r.isAbsent) {
      if (r.obtained === '' || r.obtained === null) {
        exToast(`Roll ${r.roll} (${r.name})-এর marks দিন অথবা Absent mark করুন।`, 'error');
        $(`mark-${i}`)?.focus();
        return false;
      }
      if (Number(r.obtained) > currentExam.total) {
        exToast(`Roll ${r.roll}: marks (${r.obtained}) total marks (${currentExam.total})-এর বেশি হতে পারে না।`, 'error');
        $(`mark-${i}`)?.focus();
        return false;
      }
    }
  }
  return true;
}

/* ── Submit & Calculate ── */
function submitMarks() {
  if (!validateEntries()) return;

  /* update EXAM_DEMO.results */
  const results = window.EXAM_DEMO.results;
  /* remove old entries for this exam */
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i].examId === currentExam.id) results.splice(i, 1);
  }
  /* add new entries */
  entryData.forEach(r => {
    results.push({
      examId:   currentExam.id,
      roll:     r.roll,
      name:     r.name,
      obtained: r.isAbsent ? 0 : Number(r.obtained),
      isAbsent: r.isAbsent,
      remarks:  r.remarks || ''
    });
  });

  /* calculate positions */
  const examResults = results.filter(r => r.examId === currentExam.id);
  window.calcPositions(examResults, currentExam.total);

  /* mark exam as Published */
  currentExam.status = 'Published';
  const ex = (window.EXAM_DEMO.exams||[]).find(e => e.id===currentExam.id);
  if (ex) ex.status = 'Published';

  /* persist to localStorage so exams.html & merit-list.html see the data */
  if (typeof saveExamData === 'function') saveExamData();

  /* API hook:
  fetch('/api/ucc/results/bulk', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ examId: currentExam.id, results: entryData })
  });
  */

  renderResultPreview(examResults);
  $('stepEntryCard').style.display = 'none';
  $('stepResultCard').style.display = '';
  $(`meritListLink`).href = `merit-list.html?exam=${currentExam.id}`;
  $('stepResultCard').scrollIntoView({behavior:'smooth',block:'start'});
  exToast('✅ Marks save হয়েছে! Position calculate হয়েছে।');
}

/* ── Result Preview ── */
function renderResultPreview(results) {
  const sorted  = [...results].sort((a,b) => (a.position||999)-(b.position||999));
  const total   = currentExam.total;
  const active  = results.filter(r => !r.isAbsent);
  const absent  = results.filter(r => r.isAbsent).length;
  const avg     = active.length ? (active.reduce((s,r) => s+r.obtained,0)/active.length).toFixed(1) : 0;
  const highest = active.length ? Math.max(...active.map(r=>r.obtained)) : 0;
  const lowest  = active.length ? Math.min(...active.map(r=>r.obtained)) : 0;
  const passed  = active.filter(r => currentExam.pass && r.obtained >= currentExam.pass).length;

  $('meResultSub').textContent = `${currentExam.name} — ${currentExam.batch} · ${results.length} students`;

  $('resultPreviewBody').innerHTML = sorted.map(r => `
    <tr>
      <td>
        <span class="${posClass(r.position)}">${r.position||'—'}</span>
      </td>
      <td style="font-weight:700;color:#4f46e5;">${r.roll}</td>
      <td style="font-weight:600;">${r.name}</td>
      <td style="font-weight:800;text-align:center;">${r.isAbsent?'ABS':r.obtained}</td>
      <td style="text-align:center;color:#64748b;">${total}</td>
      <td style="text-align:center;font-weight:700;">${r.isAbsent?'—':r.percentage+'%'}</td>
      <td><span class="me-grade ${gradeClass(r.grade)}">${r.grade}</span></td>
      <td>
        ${r.isAbsent
          ? '<span style="color:#94a3b8;font-size:12px;">Absent</span>'
          : (currentExam.pass
              ? (r.obtained>=currentExam.pass
                  ? '<span style="color:#059669;font-weight:700;font-size:12px;">✓ Pass</span>'
                  : '<span style="color:#dc2626;font-weight:700;font-size:12px;">✗ Fail</span>')
              : '—')}
      </td>
    </tr>`).join('');

  $('meResultSummary').innerHTML = `
    <div class="me-res-box"><small>Average</small><strong>${avg}%</strong></div>
    <div class="me-res-box"><small>Highest</small><strong>${highest}</strong></div>
    <div class="me-res-box"><small>Lowest</small><strong>${lowest}</strong></div>
    <div class="me-res-box"><small>Passed</small><strong style="color:#059669;">${currentExam.pass?passed:'—'}</strong></div>
    <div class="me-res-box"><small>Absent</small><strong style="color:#ef4444;">${absent}</strong></div>`;
}

/* ── Navigation ── */
function goBackToSelect() {
  $('stepEntryCard').style.display = 'none';
  $('stepSelectCard').style.display = '';
  currentExam = null;
}
function goBackToEntry() {
  $('stepResultCard').style.display = 'none';
  $('stepEntryCard').style.display  = '';
}

/* ── Init ── */
function initMarkEntry() {
  const user = JSON.parse(sessionStorage.getItem('uccAdminUser')||'{}');
  if (user.username) $('uccAdminName').textContent = user.username;
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem('uccAdminToken');
    window.location.href = 'admin-login.html';
  });

  renderExamCards();
}

document.addEventListener('DOMContentLoaded', initMarkEntry);
