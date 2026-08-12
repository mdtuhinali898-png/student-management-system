# Payment & Batch Collection Guide - SMS (Student Management System)

## 📌 Overview

This document explains how **Payment Collection** and **Batch Collection** work in the SMS system with MongoDB integration.

---

## Part 1: Payment Collection (পেমেন্ট কালেকশন)

### 1.1 MongoDB Schema (Payment Model)

Collection name: `payments` (automatically created by Mongoose)

```javascript
// backend/models/Payment.js - পেমেন্টের MongoDB Schema

{
  receiptNo: String,       // রসিদ নম্বর (Auto-generated: RCPT-{timestamp}-{count})
  studentId: String,       // ছাত্রের আইডি (ref: Student.studentId)
  studentName: String,     // ছাত্রের নাম (denormalized for speed)
  month: String,           // পেমেন্টের মাস (e.g., "July", "August")
  year: Number,            // পেমেন্টের বছর (e.g., 2024, 2025, 2026)
  fee: Number,             // মাসিক বেতন
  discount: Number,        // ছাড়ের পরিমাণ
  fine: Number,            // জরিমানা
  amount: Number,          // পরিশোধিত টাকা
  paymentMethod: String,   // পেমেন্ট মেথড: "Cash", "bKash", "Nagad", "Bank Transfer", "Rocket", "Card"
  status: String,          // স্ট্যাটাস: "Paid", "Partial", "Due"
  remarks: String,         // মন্তব্য
  date: String,            // পেমেন্টের তারিখ (YYYY-MM-DD)
  createdAt: Date,         // অটো-জেনারেটেড (Timestamp)
  updatedAt: Date          // অটো-জেনারেটেড (Timestamp)
}
```

### 1.2 Payment Collection Workflow (পেমেন্ট সংগ্রহ কিভাবে কাজ করে)

```
Step 1: Student Search
────────────────────────────────────
  ▶ ইউজার payments.html পৃষ্ঠায় যায়
  ▶ Student ID লিখে Search বাটনে ক্লিক করে
  ▶ ফ্রন্টএন্ড API কল করে: GET /api/students/{studentId}
  ▶ API থেকে Student-এর তথ্য আসে (নাম, ব্যাচ, ফি, ইত্যাদি)
  ▶ Student Info Card দেখায়

Step 2: Payment Form Fill
────────────────────────────────────
  ▶ মাস সিলেক্ট করা হয় (January - December)
  ▶ ফি অটো-লোড হয় student.fee থেকে
  ▶ Discount/Fine দেওয়া যায়
  ▶ Paid Amount সেট করা হয়
  ▶ Payment Method সিলেক্ট করা হয় (Cash/bKash/Nagad/Bank)

Step 3: Calculation
────────────────────────────────────
  Net Payable = Fee - Discount + Fine
  Status নির্ধারণ:
    - paid >= net payable  → "Paid"
    - paid > 0 && paid < net payable → "Partial"
    - paid == 0 → "Due"

Step 4: Save to MongoDB
────────────────────────────────────
  ফ্রন্টএন্ড POST করে: POST /api/payments
  Body: { studentId, studentName, month, year, fee, discount, fine, amount, paymentMethod, status, date }
  ব্যাকএন্ড:
    1. receiptNo জেনারেট করে: "RCPT-" + Date.now() + "-" + count
    2. Payment.save() → MongoDB তে সেভ
    3. Response: { success, payment }

Step 5: Receipt
────────────────────────────────────
  ▶ Success notification দেখায়
  ▶ receipt.html পৃষ্ঠায় রিডাইরেক্ট করে
  ▶ Payment History টেবিল আপডেট হয়
  ▶ Today's Collection আপডেট হয়
```

### 1.3 Payment API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/payments` | সব পেমেন্ট দেখে (ফিল্টার: month, method, status, studentId) |
| `GET` | `/api/payments/:id` | নির্দিষ্ট পেমেন্টের বিস্তারিত |
| `GET` | `/api/payments/student/:studentId` | নির্দিষ্ট ছাত্রের সব পেমেন্ট |
| `GET` | `/api/payments/stats/overview` | Today's collection, Monthly income, Total payments, Method stats |
| `POST` | `/api/payments` | নতুন পেমেন্ট যোগ করে |
| `PUT` | `/api/payments/:id` | পেমেন্ট আপডেট করে |
| `DELETE` | `/api/payments/:id` | পেমেন্ট ডিলিট করে |

### 1.4 Example Payment API Call

```javascript
// ফ্রন্টএন্ড থেকে পেমেন্ট সেভ করার কোড
async function savePaymentToAPI(paymentData) {
    const response = await fetch('http://localhost:5000/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            studentId: "H26-001",
            studentName: "Ahmed Rahman",
            month: "July",
            year: 2026,
            fee: 1500,
            discount: 0,
            fine: 0,
            amount: 1500,
            paymentMethod: "Cash",
            status: "Paid",
            date: "2026-07-20"
        })
    });
    return await response.json();
}
```

### 1.5 MongoDB Queries for Payment Reports

```javascript
// Today's Collection
const today = new Date().toISOString().split('T')[0]; // "2026-07-20"
const todayPayments = await Payment.find({ date: today });
const todayTotal = todayPayments.reduce((sum, p) => sum + p.amount, 0);

// Monthly Collection
const monthlyPayments = await Payment.find({ month: "July", year: 2026 });
const monthlyTotal = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

// Student Payment History
const studentPayments = await Payment.find({ studentId: "H26-001" }).sort({ date: -1 });

// Payment Method Stats (Aggregation)
const methodStats = await Payment.aggregate([
    { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amount' } } }
]);

// Batch-wise Collection
const batchStudents = await Student.find({ batch: "HSC 2026" });
const ids = batchStudents.map(s => s.studentId);
const batchPayments = await Payment.find({ studentId: { $in: ids } });
const batchTotal = batchPayments.reduce((sum, p) => sum + p.amount, 0);
```

---

## Part 2: Batch Collection (ব্যাচ কালেকশন)

### 2.1 MongoDB Schema (Batch Model)

Collection name: `batches` (automatically created by Mongoose)

```javascript
// backend/models/Batch.js - ব্যাচের MongoDB Schema

{
  name: String,        // ব্যাচের নাম (e.g., "HSC 2026", "SSC 2025")
  year: Number,        // বছর (e.g., 2026)
  fee: Number,         // ডিফল্ট মাসিক ফি (default: 1500)
  description: String, // ব্যাচ সম্পর্কে বিস্তারিত
  status: String,      // "Active" বা "Inactive" (default: "Active")
  createdDate: String, // তৈরির তারিখ (YYYY-MM-DD, auto-generated)
  createdAt: Date,     // Mongoose timestamp
  updatedAt: Date      // Mongoose timestamp
}
```

### 2.2 Batch Collection Workflow (ব্যাচ কালেকশন কিভাবে কাজ করে)

```
Step 1: Batch তৈরি (Admins only)
────────────────────────────────────
  ▶ batches.html পৃষ্ঠায় যায়
  ▶ "Add New Batch" বাটনে ক্লিক করে
  ▶ Batch Name, Year, Fee, Description, Status দেয়
  ▶ ব্যাকএন্ডে POST /api/batches
  ▶ MongoDB তে সেভ হয়
  ▶ Student-এর admission fee ব্যাচ থেকে নেয়

Step 2: Batch-এর ছাত্রদের তালিকা
────────────────────────────────────
  Student.batch = batch.name (Relationship)
  
  ব্যাচের সব ছাত্র: 
  GET /api/batches/{batchName}/students
  → Student.find({ batch: batchName })

Step 3: Batch-wise Collection গণনা
────────────────────────────────────
  ব্যাচের কালেকশন বের করার লজিক:
  
  1. ব্যাচের সব ছাত্র খুঁজে বের করো
  2. সব ছাত্রের পেমেন্ট বের করো
  3. কালেকশন = সব পেমেন্টের যোগফল
  4. ডিফল্ট = expected - collected

  ⤷ batches.js-এ getBatchStats(name) ফাংশন:
    - batchStudents = students যাদের batch === name
    - studentIds = batchStudents.map(s => s.studentId)
    - batchPayments = payments.filter(p => studentIds.includes(p.studentId))
    - expected = totalStudents × fee
    - collected = batchPayments.reduce((sum, p) => sum + p.amount, 0)
    - due = expected - collected
    - rate = (collected / expected) × 100

Step 4: Batch Dashboard Stats
────────────────────────────────────
  batches.html পৃষ্ঠায় দেখায়:
  ▶ Total Batches (মোট ব্যাচ)
  ▶ Total Students (সব ব্যাচের ছাত্র)
  ▶ Total Collection (সব ব্যাচের কালেকশন)
  ▶ Total Due (সব ব্যাচের বকেয়া)
  ▶ Charts:
     - Students per Batch (Pie/Doughnut Chart)
     - Collection per Batch (Bar Chart)
```

### 2.3 Batch API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/batches` | সব ব্যাচের তালিকা |
| `GET` | `/api/batches/:id` | নির্দিষ্ট ব্যাচের বিস্তারিত |
| `GET` | `/api/batches/:batchName/students` | ব্যাচের সব ছাত্র |
| `GET` | `/api/batches/stats/overview` | ব্যাচ স্ট্যাটিসটিক্স (total collections, dues) |
| `POST` | `/api/batches` | নতুন ব্যাচ তৈরি করে |
| `PUT` | `/api/batches/:id` | ব্যাচ আপডেট করে |
| `DELETE` | `/api/batches/:id` | ব্যাচ ডিলিট করে (শুধুমাত্র যদি কোন ছাত্র না থাকে) |

### 2.4 Batch Collection Calculation Logic (ব্যাচে কালেকশন বের করার লজিক)

```javascript
// batches.js - getBatchStats function
function getBatchStats(batchName) {
    const batchStudents = studentsData.filter(s => s.batch === batchName);
    const studentIds = batchStudents.map(s => s.studentId);
    const batchPayments = paymentsData.filter(p => studentIds.includes(p.studentId));
    
    const totalStudents = batchStudents.length;
    const fee = batchStudents[0]?.fee || 0;  // ব্যাচের ফি
    
    // Expected Collection
    const expected = totalStudents * fee;
    
    // Actual Collection
    const collected = batchPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Due Amount
    const due = Math.max(0, expected - collected);
    
    // Collection Rate (%)
    const rate = expected > 0 ? ((collected / expected) * 100).toFixed(1) : 0;
    
    return { totalStudents, expected, collected, due, rate };
}

// সারাংশ: ব্যাচ স্ট্যাটিসটিক্স
const stats = {
    totalBatches: 5,
    totalStudents: 120,
    totalCollection: 180000,  // ৳1,80,000
    totalDue: 45000,          // ৳45,000
    
    // ব্যাচ-ভিত্তিক ব্রেকডাউন:
    batchWise: [
        { name: "HSC 2026", students: 30, collected: 45000, due: 10000, rate: "81.8%" },
        { name: "HSC 2027", students: 25, collected: 35000, due: 12000, rate: "74.5%" },
        { name: "SSC 2025", students: 20, collected: 30000, due: 8000, rate: "78.9%" },
    ]
}
```

### 2.5 Batch-wise Due Students Calculation

```javascript
// কোন ছাত্ররা বকেয়া আছে তা বের করার লজিক
async function getDueStudents() {
    const allStudents = await Student.find({ status: 'Active' });
    const allPayments = await Payment.find();
    
    const dueStudents = allStudents.map(student => {
        const studentPayments = allPayments.filter(p => p.studentId === student.studentId);
        const paidMonths = new Set(studentPayments.map(p => p.month));
        const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
        
        // 3 মাস পর্যন্ত বকেয়া হিসাব
        const dueMonths = Math.max(0, 3 - paidMonths.size);
        const totalDue = (student.fee * dueMonths) - totalPaid;
        
        return {
            student: student.name,
            studentId: student.studentId,
            batch: student.batch,
            dueMonths,
            totalDue: Math.max(0, totalDue)
        };
    }).filter(item => item.dueMonths > 0);
    
    return dueStudents;
}
```

---

## Part 3: Database Relationships (ডাটাবেজ রিলেশনশিপ)

```
┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
│      Batches        │       │      Students        │       │      Payments        │
├─────────────────────┤       ├─────────────────────┤       ├─────────────────────┤
│ _id: ObjectId       │       │ _id: ObjectId       │       │ _id: ObjectId       │
│ name: "HSC 2026"    │──────▶│ studentId: "H26-001"│──────▶│ receiptNo: "RCPT-.." │
│ year: 2026          │       │ name: "Ahmed"       │       │ studentId: "H26-001" │
│ fee: 1500           │       │ batch: "HSC 2026"   │       │ month: "July"        │
│ status: "Active"    │       │ fee: 1500           │       │ amount: 1500         │
└─────────────────────┘       │ status: "Active"    │       │ status: "Paid"       │
                              └─────────────────────┘       └─────────────────────┘
```

### Relationships Explained:
1. **Batch → Student**: One-to-Many (এক ব্যাচে অনেক ছাত্র)
   - `Student.batch` = `Batch.name` (Referential Relationship)
   
2. **Student → Payment**: One-to-Many (এক ছাত্রের অনেক পেমেন্ট)
   - `Payment.studentId` = `Student.studentId` (Referential Relationship)

---

## Part 4: Frontend Collection Pages

### 4.1 payments.html - পেমেন্ট কালেকশন পেজ
- **URL**: `http://localhost:5000/payments.html`
- **Features**:
  - Student ID দিয়ে সার্চ
  - Recent Searches (স্থানীয় স্টোরেজে রাখে)
  - অটো-ক্যালকুলেশন: Fee - Discount + Fine
  - Payment Method: Cash, bKash, Nagad, Bank
  - Payment History with Filters (Month, Method, Status)
  - Today's Collection Live Counter
  - Processing Status with Overlay
  - Receipt Redirect

### 4.2 batches.html - ব্যাচ ম্যানেজমেন্ট পেজ
- **URL**: `http://localhost:5000/batches.html`
- **Features**:
  - ব্যাচ CRUD (Create, Read, Update, Delete)
  - Statistics Cards (Total Batches, Students, Collection, Due)
  - Charts (Chart.js):
    - Students per Batch (Doughnut)
    - Collection per Batch (Bar)
  - Batch-wise Collection Rate (%)
  - Filter by Status (Active/Inactive)
  - View Batch Details with Student List

---

## Part 5: Quick MongoDB Setup

```bash
# MongoDB চালু করা
mongod

# Database স্বয়ংক্রিয়ভাবে তৈরি হবে যখন প্রথম ডাটা সেভ করবেন
# Database Name: sms-database (backend/.env এ সেট করা)
# Collections: students, payments, batches

# .env ফাইলের MongoDB URI
MONGODB_URI=mongodb://localhost:27017/sms-database
```

### MongoDB চেক করার জন্য কমান্ড:
```bash
# MongoDB তে ডাটা চেক করুন
mongosh
use sms-database
show collections
db.payments.find().pretty()
db.batches.find().pretty()
db.students.find().pretty()
```

---

## Part 5B: ✨ NEW FEATURE - 12-Month Payment Status Grid

### What It Does
When you search for a student by ID on the **payments.html** page, after showing the student's info, the system now also displays a **12-month payment status grid** showing each month's payment status (Paid ✅ / Partial ⚠️ / Unpaid ❌).

### How It Works (Step by Step)

```
Step 1: Search Student
────────────────────────────────────
  User enters Student ID and clicks Search

Step 2: API Call (NEW Endpoint)
────────────────────────────────────
  GET /api/payments/student/{studentId}/monthly-status
  
  Backend Logic:
  1. Finds the student by studentId
  2. Finds ALL payments for this student
  3. Loops through 12 months (January - December)
  4. For each month, checks if a payment exists
  5. Determines status:
     - totalPaid >= fee → "Paid"
     - totalPaid > 0 && < fee → "Partial"  
     - no payment → "Unpaid"
  6. Returns: student info + monthlyStatus array + statistics

Step 3: Display Grid
────────────────────────────────────
  Frontend renders a 6-column grid with 12 cards
  Each card shows:
  - Month name (Jan, Feb, Mar...)
  - Status icon (✅ ⚠️ ❌)
  - Status text (Paid / Partial / Unpaid)
  - Paid amount (if any)
  - Payment date (if paid)
  - Receipt number (if paid)

Step 4: Statistics Summary
────────────────────────────────────
  Three summary badges on top right:
  ✅ Paid: 5
  ⚠️ Partial: 2
  ❌ Unpaid: 5
  
  Four totals at bottom:
  - Total Expected (fee × 12)
  - Total Paid
  - Total Due
  - Collection Rate (%)
```

### API Response Example

```json
{
  "success": true,
  "student": {
    "studentId": "H26-001",
    "name": "Ahmed Rahman",
    "batch": "HSC 2026",
    "fee": 1500,
    "phone": "01712345678"
  },
  "monthlyStatus": [
    {
      "month": "January",
      "monthNum": 1,
      "status": "Paid",
      "amount": 1500,
      "fee": 1500,
      "paidDate": "2026-01-15",
      "receiptNo": "RCPT-1234567890-1",
      "paymentMethod": "Cash"
    },
    {
      "month": "February",
      "monthNum": 2,
      "status": "Unpaid",
      "amount": 0,
      "fee": 1500,
      "paidDate": null,
      "receiptNo": null
    }
    // ... remaining months
  ],
  "statistics": {
    "totalExpected": 18000,
    "totalPaid": 13500,
    "totalDue": 4500,
    "paidMonths": 5,
    "partialMonths": 2,
    "unpaidMonths": 5,
    "collectionRate": "75.0"
  }
}
```

### Visual Representation

```
┌─────────────────────────────────────────────────────────┐
│  📅 12-Month Payment Status    ✅ Paid: 5 ⚠️ Partial: 2 ❌ Unpaid: 5 │
├─────────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│ │ JAN  │ │ FEB  │ │ MAR  │ │ APR  │ │ MAY  │ │ JUN  │ │
│ │  ✅  │ │  ⚠️  │ │  ✅  │ │  ❌  │ │  ✅  │ │  ❌  │ │
│ │ Paid │ │Part. │ │ Paid │ │Unpaid│ │ Paid │ │Unpaid│ │
│ │৳1500 │ │৳1000 │ │৳1500 │ │ ৳0   │ │৳1500 │ │ ৳0   │ │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│ │ JUL  │ │ AUG  │ │ SEP  │ │ OCT  │ │ NOV  │ │ DEC  │ │
│ │  ✅  │ │  ❌  │ │  ✅  │ │  ❌  │ │  ❌  │ │  ❌  │ │
│ │ Paid │ │Unpaid│ │ Paid │ │Unpaid│ │Unpaid│ │Unpaid│ │
│ │৳1500 │ │ ৳0   │ │৳1500 │ │ ৳0   │ │ ৳0   │ │ ৳0   │ │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ │
├─────────────────────────────────────────────────────────┤
│ Total Expected: ৳18,000  Paid: ৳13,500  Due: ৳4,500  │
│ Collection Rate: 75.0%                                  │
└─────────────────────────────────────────────────────────┘
```

### Color Coding

| Status | Color | Background | Border |
|--------|-------|------------|--------|
| **Paid** ✅ | Green (#155724) | `#d4edda → #c3e6cb` | `#28a745` |
| **Partial** ⚠️ | Yellow (#856404) | `#fff3cd → #ffeaa7` | `#ffc107` |
| **Unpaid** ❌ | Red (#721c24) | `#fff5f5 → #ffe0e0` | `#dc3545` |

### Implementation Files Modified

1. **backend/routes/payments.js** - Added new endpoint `GET /api/payments/student/:studentId/monthly-status`
2. **frontend/payments.html** - Added HTML structure for monthly status section
3. **frontend/assets/css/payments.css** - Added CSS styles for monthly grid, badges, totals
4. **frontend/assets/js/payments.js** - Added `loadMonthlyPaymentStatus()` and `renderMonthlyStatus()` functions

---

## Part 6: Full Payment Collection Flow (End-to-End)

```
User Input
    │
    ▼
Search Student (payments.html)
    │
    ▼
GET /api/students/{studentId}  ──►  MongoDB (Students Collection)
    │
    ▼
Display Student Info + Payment Form
    │
    ▼
User fills: Month, Discount, Fine, Paid Amount, Method
    │
    ▼
Frontend Validation + Auto-Calculation
    │
    ▼
POST /api/payments  ──►  MongoDB (Payments Collection)
    │
    ▼
Generate Receipt No. + Save
    │
    ▼
Show Success → Redirect to receipt.html
    │
    ▼
Update Payment History + Today's Collection
    │
    ▼
Batch-wise Stats Updated Automatically (batches.html)
```

---

## Part 7: Collection Reports & Analytics

### Available Reports:

1. **Daily Collection** (দৈনিক কালেকশন)
   - `GET /api/payments/stats/overview`
   - Returns: todayCollection, todayPaymentsCount

2. **Monthly Collection** (মাসিক কালেকশন)
   - Filter by: month + year
   - `GET /api/payments?month=July&year=2026`

3. **Batch-wise Collection** (ব্যাচ ভিত্তিক কালেকশন)
   - Calculated in batches.js via getBatchStats()
   - Shows per batch: collected, due, collection rate

4. **Payment Method Analysis** (পেমেন্ট মেথড অ্যানালাইসিস)
   - MongoDB Aggregation
   - Shows: Cash vs bKash vs Nagad vs Bank

5. **Due Student List** (বকেয়া ছাত্রদের তালিকা)
   - Students with incomplete payments
   - Due months calculation
   - Total due amount

---

এই পুরো সিস্টেমটি MongoDB, Express.js, এবং Vanilla JavaScript দিয়ে তৈরি। ফ্রন্টএন্ড API-এর মাধ্যমে ব্যাকএন্ডের সাথে যোগাযোগ করে এবং সব ডাটা MongoDB তে সংরক্ষিত হয়।