/* ==========================================================================
   UCC পাবনা — Exam Management JS
   Demo data — API-ready structure (replace fetch calls later)
   ========================================================================== */

/* ── Demo Data (persisted in localStorage so it survives page navigation) ── */
const STORAGE_KEY = 'ucc_exam_data_v1';

function loadExamData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.exams) && Array.isArray(parsed.results)) {
        return parsed;
      }
    }
  } catch (e) { /* ignore corrupted storage */ }
  return {
    exams: [
      { id:'EX001', name:'Model Test 01', batch:'Medical-2026-A',   type:'MCQ',       subject:'Physics + Chemistry', date:'2026-07-15', total:100, pass:40, duration:90,  status:'Published', notes:'' },
      { id:'EX002', name:'Model Test 02', batch:'Medical-2026-A',   type:'MCQ',       subject:'Biology + Chemistry', date:'2026-07-29', total:100, pass:40, duration:90,  status:'Published', notes:'' },
      { id:'EX003', name:'Model Test 01', batch:'Engineering-2026', type:'Written',    subject:'Higher Math + Physics', date:'2026-07-20', total:100, pass:40, duration:120, status:'Published', notes:'' },
      { id:'EX004', name:'Model Test 01', batch:'Varsity-A-2026',   type:'Mixed',     subject:'All Subjects', date:'2026-07-25', total:100, pass:40, duration:90,  status:'Published', notes:'' },
      { id:'EX005', name:'Weekly Test 01',batch:'Medical-2026-B',   type:'MCQ',       subject:'Biology', date:'2026-08-01', total:50,  pass:20, duration:45,  status:'Draft',     notes:'পরের সপ্তাহে নেওয়া হবে' },
      { id:'EX006', name:'Model Test 03', batch:'Medical-2026-A',   type:'Model Test',subject:'Full Syllabus', date:'2026-08-10', total:200, pass:80, duration:180, status:'Draft',     notes:'' }
    ],
    results: [
      /* EX001 Medical-2026-A */
      { examId:'EX001', roll:'101', name:'Rahim Ahmed',     obtained:85, isAbsent:false },
      { examId:'EX001', roll:'102', name:'Karim Hossain',   obtained:72, isAbsent:false },
      { examId:'EX001', roll:'103', name:'Sumon Mia',       obtained:91, isAbsent:false },
      { examId:'EX001', roll:'104', name:'Mim Akter',       obtained:0,  isAbsent:true  },
      { examId:'EX001', roll:'105', name:'Tanvir Ahmed',    obtained:78, isAbsent:false },
      /* EX002 Medical-2026-A */
      { examId:'EX002', roll:'101', name:'Rahim Ahmed',     obtained:80, isAbsent:false },
      { examId:'EX002', roll:'102', name:'Karim Hossain',   obtained:68, isAbsent:false },
      { examId:'EX002', roll:'103', name:'Sumon Mia',       obtained:88, isAbsent:false },
      { examId:'EX002', roll:'104', name:'Mim Akter',       obtained:55, isAbsent:false },
      { examId:'EX002', roll:'105', name:'Tanvir Ahmed',    obtained:0,  isAbsent:true  },
      /* EX003 Engineering-2026 */
      { examId:'EX003', roll:'201', name:'Sadia Islam',     obtained:62, isAbsent:false },
      { examId:'EX003', roll:'202', name:'Nafis Rahman',    obtained:77, isAbsent:false },
      /* EX004 Varsity-A-2026 */
      { examId:'EX004', roll:'301', name:'Arif Hossain',    obtained:58, isAbsent:false },
      { examId:'EX004', roll:'302', name:'Jannatul Ferdous',obtained:83, isAbsent:false },
      { examId:'EX004', roll:'303', name:'Nusrat Jahan',    obtained:0,  isAbsent:true  }
    ]
  };
}

const EXAM_DEMO = loadExamData();

function saveExamData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ exams: EXAM_DEMO.exams, results: EXAM_DEMO.results }));
  } catch (e) { /* storage full / unavailable */ }
}

/* ── State ── */
let deleteTargetId = null;
let filteredExams  = [...EXAM_DEMO.exams];

/* ── Helpers ── */
const $ = id => document.getElementById(id);
const exMoney = n => '৳' + Number(n||0).toLocaleString('en-IN');
function exToast(msg, type = 'success') {
  const t = $('exToast');
  t.textContent = msg;
  t.className   = 'ex-toast' + (type === 'error' ? ' error' : '');
  clearTimeout(window._exToastTimer);
  window._exToastTimer = setTimeout(() => t.className = 'ex-toast hidden', 3200);
}
function getGrade(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}
function calcPositions(results, totalMarks) {
  const active = results.filter(r => !r.isAbsent).sort((a,b) => b.obtained - a.obtained);
  let pos = 1;
  active.forEach((r, i) => {
    if (i > 0 && r.obtained < active[i-1].obtained) pos = i + 1;
    r.position   = pos;
    r.percentage = totalMarks ? Math.round((r.obtained / totalMarks) * 100 * 10) / 10 : 0;
    r.grade      = getGrade(r.percentage);
  });
  results.filter(r => r.isAbsent).forEach(r => { r.position = null; r.percentage = 0; r.grade = 'ABS'; });
  return results;
}
function entryCount(examId) {
  return EXAM_DEMO.results.filter(r => r.examId === examId && !r.isAbsent).length;
}

/* ── Stat Cards ── */
function renderStats() {
  const total     = EXAM_DEMO.exams.length;
  const published = EXAM_DEMO.exams.filter(e => e.status === 'Published').length;
  const draft     = EXAM_DEMO.exams.filter(e => e.status === 'Draft').length;
  const entries   = EXAM_DEMO.results.filter(r => !r.isAbsent).length;
  $('statTotal').textContent     = total;
  $('statPublished').textContent = published;
  $('statDraft').textContent     = draft;
  $('statEntries').textContent   = entries;
}

/* ── Filter ── */
function applyFilter() {
  const batch  = $('filterBatch').value;
  const type   = $('filterType').value;
  const status = $('filterStatus').value;
  const q      = ($('filterSearch').value || '').toLowerCase();
  filteredExams = EXAM_DEMO.exams.filter(e =>
    (batch  === 'all' || e.batch   === batch)  &&
    (type   === 'all' || e.type    === type)   &&
    (status === 'all' || e.status  === status) &&
    (!q || e.name.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q))
  );
  renderTable();
}
function resetFilter() {
  $('filterBatch').value  = 'all';
  $('filterType').value   = 'all';
  $('filterStatus').value = 'all';
  $('filterSearch').value = '';
  filteredExams = [...EXAM_DEMO.exams];
  renderTable();
}

/* ── Table ── */
function renderTable() {
  $('examCountBadge').textContent = filteredExams.length + ' Exams';
  const tbody = $('examTableBody');
  if (!filteredExams.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:#64748b;">
      <div style="font-size:36px;margin-bottom:10px;opacity:.4;">📋</div>
      কোনো exam পাওয়া যায়নি।</td></tr>`;
    return;
  }
  tbody.innerHTML = filteredExams.map((e, i) => {
    const cnt    = entryCount(e.id);
    const pubBtn = e.status === 'Published'
      ? `<button class="ex-act ex-act-unpub" onclick="toggleStatus('${e.id}')"><i class="fas fa-eye-slash"></i> Unpublish</button>`
      : `<button class="ex-act ex-act-pub"   onclick="toggleStatus('${e.id}')"><i class="fas fa-eye"></i> Publish</button>`;
    return `<tr>
      <td style="font-weight:700;color:#4f46e5;">${i+1}</td>
      <td>
        <div style="font-weight:700;color:#0f172a;">${e.name}</div>
        <div style="font-size:11px;color:#64748b;">${e.subject || '—'}</div>
      </td>
      <td style="font-size:13px;">${e.batch}</td>
      <td><span class="ex-type">${e.type}</span></td>
      <td style="font-size:13px;">${e.date}</td>
      <td style="font-weight:700;text-align:center;">${e.total}</td>
      <td style="text-align:center;">
        <span style="font-weight:700;color:${cnt>0?'#059669':'#64748b'};">${cnt}</span>
      </td>
      <td><span class="ex-badge ${e.status==='Published'?'ex-badge-published':'ex-badge-draft'}">${e.status}</span></td>
      <td>
        <div class="ex-action-btns">
          <a href="mark-entry.html?exam=${e.id}" class="ex-act ex-act-mark"><i class="fas fa-pen"></i> Marks</a>
          <a href="merit-list.html?exam=${e.id}" class="ex-act ex-act-merit"><i class="fas fa-list-ol"></i> Merit</a>
          ${pubBtn}
          <button class="ex-act ex-act-del" onclick="openDeleteModal('${e.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

/* ── Toggle status ── */
function toggleStatus(id) {
  const exam = EXAM_DEMO.exams.find(e => e.id === id);
  if (!exam) return;
  exam.status = exam.status === 'Published' ? 'Draft' : 'Published';
  saveExamData();
  applyFilter();
  renderStats();
  exToast(`"${exam.name}" → ${exam.status}`);
}

/* ── Create Exam Modal ── */
function openCreateModal() {
  $('createModal').style.display = 'flex';
  $('newExamDate').value = new Date().toISOString().split('T')[0];
  setTimeout(() => $('newExamName').focus(), 80);
}
function closeCreateModal(e) {
  if (e && e.target !== $('createModal')) return;
  $('createModal').style.display = 'none';
}
function saveExam() {
  const name  = $('newExamName').value.trim();
  const batch = $('newExamBatch').value;
  const type  = $('newExamType').value;
  const date  = $('newExamDate').value;
  const total = parseInt($('newExamTotal').value) || 0;

  if (!name)  { exToast('Exam name দিন।', 'error'); $('newExamName').focus(); return; }
  if (!batch) { exToast('Batch বেছে নিন।', 'error'); return; }
  if (!type)  { exToast('Exam type বেছে নিন।', 'error'); return; }
  if (!date)  { exToast('Date দিন।', 'error'); return; }
  if (!total) { exToast('Total marks দিন।', 'error'); return; }

  const newExam = {
    id:       'EX' + String(Date.now()).slice(-5),
    name, batch, type,
    subject:  $('newExamSubject').value.trim(),
    date, total,
    pass:     parseInt($('newExamPass').value) || 0,
    duration: parseInt($('newExamDuration').value) || 0,
    status:   'Draft',
    notes:    $('newExamNotes').value.trim()
  };

  EXAM_DEMO.exams.unshift(newExam);
  saveExamData();

  /* API hook: fetch('/api/ucc/exams', { method:'POST', ... }) */

  $('createModal').style.display = 'none';
  /* reset form */
  ['newExamName','newExamSubject','newExamTotal','newExamPass','newExamDuration','newExamNotes']
    .forEach(id => $(id).value = '');
  $('newExamBatch').value = '';
  $('newExamType').value  = '';

  filteredExams = [...EXAM_DEMO.exams];
  applyFilter();
  renderStats();
  exToast(`✅ "${newExam.name}" তৈরি হয়েছে (Draft)`);
}

/* ── Delete ── */
function openDeleteModal(id) {
  deleteTargetId = id;
  const exam = EXAM_DEMO.exams.find(e => e.id === id);
  $('deleteExamName').textContent = exam ? `"${exam.name}" — ${exam.batch}` : '—';
  $('deleteModal').style.display = 'flex';
}
function closeDeleteModal(e) {
  if (e && e.target !== $('deleteModal')) return;
  $('deleteModal').style.display = 'none';
  deleteTargetId = null;
}
function confirmDelete() {
  if (!deleteTargetId) return;
  const idx = EXAM_DEMO.exams.findIndex(e => e.id === deleteTargetId);
  if (idx > -1) {
    const name = EXAM_DEMO.exams[idx].name;
    EXAM_DEMO.exams.splice(idx, 1);
    /* also remove results */
    const rIdx = [];
    EXAM_DEMO.results.forEach((r,i) => { if (r.examId === deleteTargetId) rIdx.unshift(i); });
    rIdx.forEach(i => EXAM_DEMO.results.splice(i, 1));
    saveExamData();
    exToast(`🗑️ "${name}" deleted (demo)`);
  }
  closeDeleteModal();
  filteredExams = [...EXAM_DEMO.exams];
  applyFilter();
  renderStats();
}

/* ── Auth ── */
function initPage() {
  const user = JSON.parse(sessionStorage.getItem('uccAdminUser') || '{}');
  if (user.username) $('uccAdminName').textContent = user.username;

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem('uccAdminToken');
    sessionStorage.removeItem('uccAdminUser');
    window.location.href = 'admin-login.html';
  });
}

/* ── Keyboard ── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const cm = $('createModal');
    const dm = $('deleteModal');
    if (cm) cm.style.display = 'none';
    if (dm) dm.style.display = 'none';
  }
});

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  initPage();
  /* Only render exam table/stats when this page is exams.html
     (mark-entry.html & merit-list.html also load this file) */
  if (document.getElementById('examTableBody')) {
    renderStats();
    renderTable();
  }
});

/* ── Export for other pages ── */
window.EXAM_DEMO     = EXAM_DEMO;
window.calcPositions = calcPositions;
window.getGrade      = getGrade;
