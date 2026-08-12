# UCC Pabna — Print Design Guide (প্রিন্ট ডিজাইন গাইড)

> **কী জন্য?** এই গাইডটি আছে **পূরো EduSmart সিস্টেমের সব প্রিন্ট ডিজাইন** দেখানোর জন্য, আর কীভাবে সেগুলোকে **UCC পাবনার সব পেজে** প্রয়োগ করবেন সেটা বলে। কোড লিখতে শুরু করার আগে পড়তে হবে — **একবার পড়ে নিন, তারপর কোড করতে বলো।**

---

## 📋 অনুক্রমিক তালিকা / Table of Contents

1. [সিস্টেমে যে ৬টি প্রিন্ট ডিজাইন আছে](#1--সিস্টেমে-যে-৬টি-প্রিন্ট-ডিজাইন-আছে)
2. [২টি মৌলিক প্যাটার্ন (Pattern A vs Pattern B)](#2-মৌলিক-প্যাটার্ন-pattern-a-vs-pattern-b)
3. [UCC প্রিন্টের ইউনিভার্সাল গাইডলাইন](#3-ucc-প্রিন্টের-ইউনিভার্সাল-গাইডলাইন)
4. [প্রিন্টের কাঠামো (Anatomy of a Print Sheet)](#4-প্রিন্টের-কাঠামো Anatomy of a Print Sheet)
5. [UCC-এর প্রিন্ট রঙ ও ভেরিয়েবল](#5-ucc-এর-প্রিন্ট-রঙ-ও-ভেরিয়েবল)
6. [কোডের স্টার্টার টেমপ্লেট (JS)](#6-কোডের-স্টার্টার-টেমপ্লেট)
7. [প্রতিটি UCC পেজে কী প্রিন্ট লাগবে](#7-প্রতিটি-ucc-পেজে-কী-প্রিন্ট-লাগবে)

---

## 1. সিস্টেমে যে ৬টি প্রিন্ট ডিজাইন আছে

### 1.1 Receipt Print — `frontend/receipt.html`

> **ফাইল:** `receipt.html` + `assets/css/receipt.css` + `assets/js/receipt.js`

** কি প্রিন্ট হয়:** একটি রিসিপ্ট (payment / admission receipt)।

** ডিজাইন রিফারেন্স:**
| অংশ | কী থাকে |
|---|---|
| `.action-bar` (no-print) | Back button + Paper size টগলার (A4/A5) + Print / Download PDF বাটন |
| `.receipt-container` | পুরো রিসিপ্ট — A4 বা A5 সাইজে ঝলমলে। `body[data-paper-size="a4"]` বা `"a5"` দিয়ে সাইজ নিয়ন্ত্রণ |
| `.receipt-header` | গ্রেডিয়েন্ট হেডার (indigo→blue) — লোগো + ইনস্টিটিউশন ইনফো + receipt no/date |
| `.receipt-main-grid` | ২ কলাম — Left: Student Info, Right: Payment Info |
| `.info-section` | প্রতিটা সেকশন একটি কার্ড |
| `.details-table` | ফি বিস্তারিত (SL, Description, Amount) — হেডার গ্রেডিয়েন্ট |
| `.summary-section` | Grand total গ্রেডিয়েন্ট ব্লকে + Paid / Due |
| `.signature-section` | ৩ কলাম স্বাক্ষর (Student / Account Officer / Authorized) |
| `.terms-section` | শর্তাবলী |
| `.receipt-footer` | গ্রেডিয়েন্ট লাইন + Thank you + ইনস্টিটিউশন নাম + স্লোগান |
| `.receipt-watermark` | ডায়াগোনাল "RECEIPT" টেক্সট (z-0) |

**  প্রিন্ট CSS:**
```css
@media print {
  @page { margin: 3mm; }
  body[data-paper-size="a4"] .receipt-container { width: 210mm !important; height: 296mm !important; }
  body[data-paper-size="a5"] .receipt-container { width: 148mm !important; height: 209mm !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .no-print, .action-bar { display: none !important; }
}
```

** JS প্যাটার্ন:** `applyPrintPaperStyle()` — ডাইনামিকভাবে `@page` সাইজ সেট করে। `window.print()` চালিয়ে প্রিন্ট করে।

---

### 1.2 Reports Print — `frontend/reports.html`

> **ফাইল:** `reports.html` + `assets/css/reports.css` + `assets/js/reports.js`

**  ৩টি ভিন্ন প্রিন্ট মোড আছে:**

#### 1.2.1 `printActiveReport()` — স্ক্রিনের সেই ট্যাবটাই প্রিন্ট হয়
```js
function printActiveReport(){
  window.print();
}
```
- `@media print` এ hide করে: `.sidebar, .top-header, .report-hero, .filter-section, .report-tabs, .summary-cards, .charts-row, .main-footer`
- `.print-report-header` আর `.print-report-footer` দেখায় (যেগুলো স্ক্রিনে `display:none`)

#### 1.2.2 `printDailyStatement()` — ডেডিকেটেড প্রিন্ট শীট
```js
// প্যাটার্ন:
const sheet = document.createElement('section');
sheet.className = 'daily-print-sheet';
sheet.innerHTML = `...পূরো প্রিন্ট কন্টেন্ট...`;
document.body.appendChild(sheet);
document.body.classList.add('printing-daily');
window.print();
// afterprint এ cleanup
```

** প্রিন্ট শীটের কাঠামো:**
```
.daily-print-head      → "UCC Pabna" | "Branch Operations & Collection Office" | "Daily Collection Statement"
.daily-print-title     → শিরোনাম + জেনারেটেড তারিখ/ফিল্টার ইনফো (flex, justify-between)
.daily-summary-grid    → ৩ ব্লক (New admissions / Installment payments / Grand total)
.daily-methods         → Payment method breakdown (Cash, bKash, Nagad, Bank)
.daily-print-table     → লেনদেন টেবিল (Date | Receipt | Student/Batch | Type | Method | Amount)
.daily-signatures      → ৩ কলাম (Prepared by / Checked by / Branch Head)
.daily-print-footer    → "UCC Pabna · Daily Collection Statement"
```

#### 1.2.3 `printBatchLists()` — ব্যাচ-ওয়াইজ পেড/ডিউ লিস্ট
```js
// প্যাটার্ন: একই — body.printing-batch-lists > *:not(.batch-print-sheet)
```
** কাঠামো:**
```
.batch-print-head    → হেডার
.batch-print-summary → ৪ KPI (Total Students / Fully Paid / Unpaid-Due / Collection Rate)
.batch-lists-print-grid → ২ কলাম (Paid Students + Due Students)
.batch-print-signatures → ৩ কলাম স্বাক্ষর
.batch-print-footer   → ফুটার
```

#### 1.2.4 Multi-month Report
- `body.printing-mm > *:not(.multi-month-print-container)`

---

### 1.3 Batch Transfer Print — `frontend/batch-transfer.html`

> **ফাইল:** `batch-transfer.html` + `assets/css/batch-transfer.css`

- `body.printing-bw > *:not(.bw-print-sheet)` প্যাটার্ন
- `@page { size: A4; margin: 1.2cm }`

** কাঠামো:**
```
.bw-print-head        → হেডার (h1, p subtitle, h2 title, p info)
.bw-print-summary-cards → ৫ সংক্ষেপ কার্ড (small + b)
.bw-print-table       → মূল টেবিল (th গ্রেডিয়েন্ট indigo)
.bw-lists-print        → ২ কলাম (Paid / Due) — .bw-print-list-title.due রেড ভিন্ন
.bw-print-sigs         → ৩ কলাম স্বাক্ষর
.bw-print-footer        → ফুটার
```

---

### 1.4 Merit List Print — `frontend/ucc/merit-list.html`

> **ফাইল:** `frontend/ucc/merit-list.html` + `frontend/ucc/assets/css/merit-list.css`

এটা **UCC-এর নিজস্ব** প্রিন্ট ডিজাইন — স্ক্রিনের টেবিলটা সরাসরি প্রিন্ট হয়।

** `@media print` এ:**
- Hide: `.sidebar, .top-header, .ml-selector-card, .ml-action-bar, .main-footer, .no-print`
- Show: `.print-only` (ডিফল্টে `display:none`)
- Gradient রঙ গুলোকে প্রিন্ট-ফ্রেন্ডলি করে রেনে:
  - `.ml-exam-info-card` → `border: 2px solid #000`
  - `.ml-table thead` → `background: #1e1b4d`
- `@page { size: A4 portrait; margin: 1.2cm }`

** প্রিন্ট-অন্যান্য এলিমেন্ট:**
- `.ml-print-header` → `.ml-print-logo` (আইকন + h1 + p) + `.ml-print-title` (স্ট্যাম্প-স্টাইল)
- `.ml-print-footer`

---

### 1.5 Student Profile Print — `frontend/student-profile.html`

> **ফাইল:** `student-profile.html` + `assets/css/student-profile.css`

- সবচেয়ে সিম্পল। `printProfile()` → `window.print()`
- `@media print` এ:
```css
.sidebar, .top-header, .profile-actions, .main-footer { display: none !important; }
.main-content { margin-left: 0; width: 100%; }
```

---

### 1.6 Results / Exam Result Print — `frontend/view-result.html` + `frontend/exams.html`

> **ফাইল:** `assets/css/results.css`

- `@media print` এ:
```css
.sidebar, .top-header, .exam-selector, .btn, .mark-entry-actions,
.page-header-action, .filter-section, .stat-cards { display: none !important; }
.main-content { margin-left: 0 !important; padding: 0 !important; }
.result-card { box-shadow: none; border: 1px solid #ddd; border-radius: 0; }
.result-card-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
```
- মাটির হেডার গ্রেডিয়েন্ট থাকে, সেটা প্রিন্টে রঙে রয়ে যায়।

---

## 2. মৌলিক প্যাটার্ন (Pattern A vs Pattern B)

| বৈশিষ্ট্য | Pattern A: Inline Print | Pattern B: Dedicated Print Sheet |
|---|---|---|
| **কখন ব্যবহার** | স্ক্রিনের একই কন্টেন্ট প্রিন্ট করতে (profile, results, merit list, active report) | একটি আলাদা, প্রিন্ট-অপটিমাইজড লেAYOUT চাইলে (daily statement, batch list, batch summary) |
| **JS** | `window.print()` মাত্র | `createElement('section')` → inject to body → add `printing-xxx` class → `window.print()` → cleanup |
| **CSS** | `@media print { hide .no-print, show .print-only }` | `body.printing-xxx > *:not(.xxx-print-sheet) { display: none }` + `.xxx-print-sheet { display: block }` |
| **Page setup** | `@page` সাধারণ | `@page { size: A4 portrait; margin: 1.2cm }` |
| **Cleanup** | দরকার নেই | `afterprint` event + `setTimeout` fallback |
| **উদাহরণ** | student-profile, results, merit-list | daily-statement, batch-lists, batch-transfer |

> **UCC-এর জন্য:** যদি স্ক্রিনের টেবিল/কার্ডগুলো প্রিন্টে একই রাখতে চাও → **Pattern A**। যদি প্রিন্টের জন্য স্ক্রিনের থেকে আলাদা লেআউট চাই → **Pattern B**।

---

## 3. UCC প্রিন্টের ইউনিভার্সাল গাইডলাইন

যখনই UCC-এর কোনো পেজের প্রিন্ট ডিজাইন করবে, **এই রিল টু হ্যাকার গুলো মেনে চলতে হবে:**

### ✅ যেটা সবসময় থাকতে হবে (Universal Must-Haves)

1. **`@page { size: A4 portrait; margin: 1.2cm; }`** — প্রিন্টের পৃথক পৃষ্ঠা সাইজ। এটা সব প্রিন্টে ব্যবহার করতে হবে।

2. **`print-color-adjust: exact !important`** — গ্রেডিয়েন্ট ও রঙ প্রিন্টে ঠিক ভাবে আসতে হবে। কোনো transparency না চলে, সর্বদা এই রেখাটি দিয়ে দাও।

3. **Header → Summary → Content → Signatures → Footer** — প্রিন্টের স্ট্যান্ডার্ড কাঠামো।

4. **Hide screen-only elements:** যেগুলো স্ক্রিনে প্রয়োজন কিন্তু প্রিন্টে দরকার নেই (`.sidebar`, `.top-header`, `.main-footer`, `.no-print`), সেগুলোর class-এ সরাসরি `no-print` যোগ করতে পারো, অথবা `@media print` এ `display: none` করতে পারো।

5. **Institute header:** সব প্রিন্টের শীর্ষে তিনি থাকতে হবে:
   ```
   UCC Pabna
   Branch Operations & Collection Office
   <title of the document>
   <meta info: date, batch, period>
   ```

6. **Signatures block:** সব প্রিন্টের নিচে তিনি স্বাক্ষর লাইন:
   ```
   Prepared by | Checked by | Branch Head
   ```

7. **Footer:** ছোট ফুটার লাইন — `"UCC Pabna · <document type>"`।

8. **`window.print()` এর আগে body-এ `printing-xxx` ক্লাস যোগ করা** (যদি Pattern B ব্যবহার করো হয়)। আর `afterprint` এ cleanup করা।

9. **`setTimeout(cleanup, 1500)` — fallback**। কারও browser `afterprint` সাপোর্ট করে না পেলে fallback নিশ্চিত করে। সবসময় একই রাখতে পারো।

---

## 4. Anatomy of a Print Sheet (Pattern B)

**Standard HTML structure:**
```html
<section class="xxx-print-sheet">
  <!-- HEAD -->
  <header class="xxx-print-head">
    <h1>UCC Pabna</h1>
    <p>Branch Operations & Collection Office</p>
    <h2>ডকুমেন্টের শিরোনাম</h2>
    <p><b>মেটা ১:</b> ... &nbsp; | &nbsp; <b>মেটা ২:</b> ... &nbsp; | &nbsp; Generated: ...</p>
  </header>

  <!-- SUMMARY CARDS (5-column grid) -->
  <section class="xxx-print-summary-cards">
    <div><small>Label</small><b>Value</b></div> <!-- ×5 -->
  </section>

  <!-- CONTENT (table / lists / grid) -->
  <table class="xxx-print-table">
    <thead><tr><th>...</th></tr></thead>
    <tbody>...</tbody>
  </table>

  <!-- OR lists -->
  <div class="xxx-lists-print">
    <div>
      <div class="xxx-print-list-title">✓ সাব-সেকশন ১</div>
      <table class="xxx-print-table">...</table>
    </div>
    <div>
      <div class="xxx-print-list-title due">! সাব-সেকশন ২ (Due)</div>
      <table class="xxx-print-table">...</table>
    </div>
  </div>

  <!-- SIGNATURES -->
  <div class="xxx-print-sigs">
    <div>Prepared by<br><span>________________</span></div>
    <div>Checked by<br><span>________________</span></div>
    <div>Branch Head<br><span>________________</span></div>
  </div>

  <!-- FOOTER -->
  <p class="xxx-print-footer">UCC Pabna · <document type> · <date></p>
</section>
```

---

## 5. UCC-এর প্রিন্ট রঙ ও ভেরিয়েবল

UCC `design-system.css` থেকে নিয়ে নিন। এগুলো প্রিন্টেও ব্যবহার করুন:

| রঙের নাম | হেক্স | ব্যবহার |
|---|---|---|
| `--primary` / `--primary-dark` | `#6366f1` / `#4f46e5` | হেডার গ্রেডিয়েন্ট, টেবিল হেডার, সাইন্যাপস |
| `--purple` / `--purple-dark` | `#8b5cf6` / `#7c3aed` | গ্রেডিয়েন্ট মিx, লিস্ট টাইটেল |
| `--success` | `#10b981` | পেড স্ট্যাটাস (✓) |
| `--warning` | `#f59e0b` | রিভিউ স্ট্যাটাস |
| `--danger` | `#f43f5e` | ডিউ / ওভারডিউ স্ট্যাটাস |
| `--dark-900` | `#0f172a` | প্রিন্ট হেডারের টেক্সট (#172554 এর সাথে ম্যাপ) |
| `--grad-primary` | `linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #3b82f6 100%)` | হেডার ব্ল্যাকারান্ড |

** প্রিন্ট-স্ক্রিন রঙ ম্যাপিং:**
```css
/* Screen gradient → প্রিন্টে একই রঙ (print-color-adjust: exact) */
.xxx-print-head h1 { color: #172554; }       /* Dark blue, matches gradient base     */
.xxx-print-head h2 { color: #1e1b4d; }       /* Rich navy, matches gradient center  */
.xxx-print-list-title { color: #065f46; }    /* Green for "Paid"                */
.xxx-print-list-title.due { color: #991b1b; background: #fef2f2; }  /* Red for "Due"    */
.xxx-print-table th { background: #4f46e5; color: #fff; }            /* Indigo header       */
```

---

## 6. কোডের স্টার্টার টেমপ্লেট (JS)

**Pattern B — Dedicated Print Sheet (এই প্যাটার্নটি কপি করে নিন):**

```js
function printDailyStatement() {
  // 1. ডেটা নিন
  const tx = getDailyStatementTransactions();  // আপনার ডেটা থেকে

  // 2. সংক্ষেপ গণনা
  const ad = tx.filter(t => t.type === 'Admission');
  const pay = tx.filter(t => t.type === 'Payment');
  // ...

  // 3. প্রিন্ট শীট বানান
  const sheet = document.createElement('section');
  sheet.className = 'daily-print-sheet';
  sheet.id = 'dailyPrintSheet';
  sheet.innerHTML = `
    <header class="daily-print-head">
      <h1>UCC Pabna</h1>
      <p>Branch Operations & Collection Office</p>
      <h2>Collection Statement</h2>
      <p><b>Date:</b> ${esc(date)} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString('en-GB')}</p>
    </header>
    <div class="daily-summary-grid">
      <div class="daily-summary-box"><small>New admissions</small><b>${ad.length} students</b></div>
      <div class="daily-summary-box"><small>Installment payments</small><b>${pay.length} receipts</b></div>
      <div class="daily-summary-box daily-grand-total"><small>Grand total</small><b>${money(grand)}</b></div>
    </div>
    <table class="daily-print-table">
      <thead><tr><th>Date</th><th>Receipt</th><th>Student</th><th>Type</th><th>Method</th><th class="money">Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="daily-print-sigs">
      <div>Prepared by</div><div>Checked by</div><div>Branch Head</div>
    </div>
    <p class="daily-print-footer">UCC Pabna · Daily Collection Statement · ${now}</p>
  `;

  // 4. DOM-এ যোগ করুন + body class
  document.body.appendChild(sheet);
  document.body.classList.add('printing-daily');

  // 5. Print trigger
  const cleanup = () => {
    document.body.classList.remove('printing-daily');
    sheet.remove();
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup, { once: true });
  window.print();
  setTimeout(cleanup, 1500);  // fallback
}
```

**Pattern A — Inline Print (স্ক্রিনের রেজাল্ট প্রিন্ট):**
```js
function printProfile() {
  window.print();  // যতগুলো CSS-এ @media print আছে, সবই প্রযোজ্য
}
```

---

## 7. প্রতিটি UCC পেজে কী প্রিন্ট লাগবে

| UCC পেজ | প্রিন্টের ধরন | প্যাটার্ন | রেফারেন্স |
|---|---|---|---|
| `dashboard.html` | Branch Daily Summary Statement | B (dedicated sheet) | `daily-statement` মত |
| `payment.html` | Payment Receipt (A5/A4) | A (receipt-container) | `receipt.html`-এর মতো ঝলমলে |
| `batches.html` | Batch Summary Report | B (dedicated sheet) | `bw-print-summary` মত |
| `reports.html` | Daily Statement / Batch Lists / Batch Summary | B | আগেই implemented (চেক করেছো) |
| `students.html` | Student List / Class List | B (dedicated sheet) | `bw-print-sigs` মত |
| `student-profile.html` | Student Fee Ledger / Statement | A or B | `ledger-sheet` মত |
| `exams.html` | Exam Schedule / Admit Card | B | `result-card` মত |
| `mark-entry.html` | Mark sheet | A | `results.css` প্রিন্ট মত |
| `merit-list.html` | Merit List (Ranked) | A | আগেই implemented (`merit-list.css`) |
| `distribution.html` | Material Distribution Report | B | `bw-lists-print` মত |
| `receipt.html` (UCC) | Payment / Admission Receipt | A (receipt-container) | `receipt.html` এর মতো |
| `settings.html` | Institute Info Sheet | B | `bw-print-head` মত |
| `admission.html` | Admission Form / Roll Sheet | B | `bw-print-table` মত |

---

## 🔑 মূল Takeaway (কোড লিখতে আগে মনে রাখতে হবে)

1. **একই প্যাটার্ন ব্যবহার করুন** — EduSmart-এর সব প্রিন্ট **একই স্টাইল**। UCC-এর প্রিন্টগুলোও ঠিক তেমিনা — header, summary cards, সেই signature block, সেই footer।

2. **রঙ ঠিক রাখুন** — UCC-এর `--primary` (indigo), `--purple`, `--success`, `--danger` রংগুলো প্রিন্টেও রাখুন। `print-color-adjust: exact` যোগ করতে ভুলবেন না।

3. **Print sheet ক্লাস নেমকে ngôn** — `*-print-sheet`, `*-print-head`, `*-print-summary-cards`, `*-print-table`, `*-print-sigs`, `*-print-footer`। এগুলোকে প্রিন্ট CSS-এ ঠিকই ঠিকই ম্যাপ করতে পারেন।

4. **Cleanup সবসময় করুন** — `afterprint` listener + `setTimeout` fallback। না হলে DOM-এ সোনামুখো স্টায়ার হয়ে যাবে।

5. **HTML-এ `no-print` ব্যবহার করুন** — স্ক্রিনে কিন্তু প্রিন্টে না চাওয়ার জন্য (যেমন sidebar, buttons)। ক্লাসটা যোগ করে দিলে `@media print` এ সহজে hide করতে পারবেন।

---

> **এখনই কোড শুরু করতে পারো।** যে পেজের প্রিন্ট দরকার, সেটার জন্য উপরের সঠিক Pattern (A বা B) বেছে নাও, স্টার্টার টেমপ্লেট কপি করে, UCC-এর রঙ আর ডেটা দিয়ে ভরিয়ে দাও।