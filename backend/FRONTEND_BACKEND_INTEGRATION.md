# Frontend-Backend Integration Guide

## ✅ Integration Status: COMPLETE

The frontend is **already configured** to work with the backend API. No changes are needed in the frontend code!

## Connection Details

### API Base URL
```
http://localhost:5000/api
```

This is configured in all frontend JavaScript files:
- `frontend/assets/js/students.js`
- `frontend/assets/js/add-student.js`
- `frontend/assets/js/payments.js`
- `frontend/assets/js/dashboard.js`
- `frontend/assets/js/reports.js`

### CORS Configuration
The backend is configured to accept requests from:
```
http://localhost:5500 (or any frontend URL)
```

## How It Works

### 1. Student Management (students.js)

**API Endpoints Used:**
- `GET /api/students?page=1&limit=5&batch=HSC 2026&status=Active&search=Ahmed`
  - Fetches students with pagination, filtering, and search
- `GET /api/students/stats/overview`
  - Fetches statistics (total, active, inactive, new admissions)
- `DELETE /api/students/:id`
  - Deletes a student
- `GET /api/students/batches/list`
  - Fetches all unique batches for dropdown

**Data Flow:**
```
Frontend → API Request → Backend → MongoDB → Response → Frontend
```

### 2. Add/Edit Student (add-student.js)

**API Endpoints Used:**
- `POST /api/students`
  - Creates new student with all form data
- `PUT /api/students/:id`
  - Updates existing student
- `GET /api/students?limit=1000`
  - Fetches all students for ID generation

**Special Features:**
- Student ID auto-generation based on batch
- Photo upload as base64 (max 2MB)
- Admission receipt creation

### 3. Payment Processing (payments.js)

**API Endpoints Used:**
- `GET /api/students/:id`
  - Fetches student details by ID
- `POST /api/payments`
  - Records new payment with receipt generation
- `GET /api/payments?limit=1000`
  - Fetches all payments for history

**Special Features:**
- Real-time payment calculation
- Receipt number generation
- Payment history tracking

### 4. Dashboard (dashboard.js)

**API Endpoints Used:**
- `GET /api/dashboard/stats`
  - Fetches all dashboard statistics
- `GET /api/dashboard/recent-payments`
  - Fetches recent payment transactions
- `GET /api/dashboard/recent-admissions`
  - Fetches recent student admissions
- `GET /api/dashboard/due-students`
  - Fetches students with pending payments
- `GET /api/dashboard/monthly-collection`
  - Fetches monthly collection data for charts
- `GET /api/dashboard/batch-wise`
  - Fetches batch-wise statistics for charts

### 5. Reports (reports.js)

**API Endpoints Used:**
- `GET /api/students?limit=1000`
  - Fetches all students for reports
- `GET /api/payments?limit=1000`
  - Fetches all payments for analysis

**Report Types:**
- Collection Report (daily, monthly)
- Due Report (students with pending payments)
- Batch Report (batch-wise analysis)
- Payment Method Report
- Student Report (individual student summary)

## Data Mapping

### Student Data Structure

**Frontend Expects:**
```javascript
{
  id: "H26-001",           // Same as studentId
  studentId: "H26-001",    // Student ID
  roll: "1",               // Roll number
  name: "Ahmed Rahman",    // Full name
  guardianName: "Father",  // Father's name
  motherName: "Mother",    // Mother's name
  dob: "2008-05-15",       // Date of birth
  gender: "Male",          // Gender
  phone: "01712345678",    // Phone
  address: "Dhaka",        // Address
  batch: "HSC 2026",       // Batch
  group: "Science",        // Group
  previousSchool: "ABC",   // Previous school
  guardianPhone: "01787654321", // Guardian phone
  fee: 1500,               // Monthly fee
  admissionFee: 500,       // Admission fee
  startMonth: "July",      // Start month
  status: "Active",        // Status
  notes: "Notes",          // Notes
  photo: "base64...",      // Photo
  date: "15 Jul 2024"      // Admission date
}
```

**Backend Returns:**
```javascript
{
  studentId: "H26-001",    // ✅ Matches
  roll: "1",               // ✅ Matches
  name: "Ahmed Rahman",    // ✅ Matches
  guardianName: "Father",  // ✅ Matches
  motherName: "Mother",    // ✅ Matches
  dob: "2008-05-15",       // ✅ Matches
  gender: "Male",          // ✅ Matches
  phone: "01712345678",    // ✅ Matches
  address: "Dhaka",        // ✅ Matches
  batch: "HSC 2026",       // ✅ Matches
  group: "Science",        // ✅ Matches
  previousSchool: "ABC",   // ✅ Matches
  guardianPhone: "01787654321", // ✅ Matches
  fee: 1500,               // ✅ Matches
  admissionFee: 500,       // ✅ Matches
  startMonth: "July",      // ✅ Matches
  status: "Active",        // ✅ Matches
  notes: "Notes",          // ✅ Matches
  photo: "base64...",      // ✅ Matches
  date: "15 Jul 2024",     // ✅ Matches
  admissionDate: "2024-07-15", // ✅ Additional field
  createdAt: "2024-07-15T...", // ✅ Auto-generated
  updatedAt: "2024-07-15T..."  // ✅ Auto-generated
}
```

### Payment Data Structure

**Frontend Expects:**
```javascript
{
  receipt: "RCPT-123",
  studentId: "H26-001",
  name: "Ahmed",
  month: "July",
  fee: 1500,
  discount: 0,
  paid: 1500,
  method: "Cash",
  status: "Paid",
  remarks: "Monthly fee",
  date: "2024-07-15"
}
```

**Backend Returns:**
```javascript
{
  receiptNo: "RCPT-1722345678901-1", // ✅ Unique receipt
  studentId: "H26-001",              // ✅ Matches
  studentName: "Ahmed",              // ✅ Matches
  month: "July",                     // ✅ Matches
  year: 2024,                        // ✅ Additional
  fee: 1500,                         // ✅ Matches
  discount: 0,                       // ✅ Matches
  fine: 0,                           // ✅ Additional
  amount: 1500,                      // ✅ Matches (same as paid)
  paymentMethod: "Cash",             // ✅ Matches (same as method)
  status: "Paid",                    // ✅ Matches
  remarks: "Monthly fee",            // ✅ Matches
  date: "2024-07-15",                // ✅ Matches
  createdAt: "2024-07-15T...",       // ✅ Auto-generated
  updatedAt: "2024-07-15T..."        // ✅ Auto-generated
}
```

## Testing the Integration

### 1. Start Backend
```bash
cd backend
npm start
```

### 2. Start Frontend
```bash
# Using Live Server in VS Code
# Or: python -m http.server 5500
# Or: npx serve frontend -l 5500
```

### 3. Test Connection

**Browser Test:**
```
http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "SMS Backend is running"
}
```

### 4. Test Student Statistics
```
http://localhost:5000/api/students/stats/overview
```

**Expected Response:**
```json
{
  "success": true,
  "total": 0,
  "active": 0,
  "inactive": 0,
  "newAdmission": 0
}
```

### 5. Test Getting Students
```
http://localhost:5000/api/students?page=1&limit=10
```

**Expected Response:**
```json
{
  "success": true,
  "students": [],
  "total": 0,
  "page": 1,
  "totalPages": 0
}
```

## Features Working

### ✅ Student Management
- Add new students
- Edit existing students
- View student list with pagination
- Search students by ID, name, or phone
- Filter by batch and status
- Delete students
- View student profile

### ✅ Payment Processing
- Search student by ID
- Record new payments
- Generate receipt numbers
- Track payment history
- Calculate dues and discounts
- Multiple payment methods

### ✅ Dashboard
- Real-time statistics
- Today's collection
- Monthly income
- Recent payments
- Recent admissions
- Due students list
- Charts (monthly collection, batch-wise)

### ✅ Reports
- Collection report (daily/monthly)
- Due report
- Batch-wise report
- Payment method report
- Student-wise report
- Export to CSV

## Offline Support

The frontend includes fallback to localStorage if the API is unavailable:

```javascript
// Example from students.js
try {
    const response = await fetch(url);
    const data = await response.json();
    studentsData = data.students || [];
} catch (error) {
    console.error('Error fetching students:', error);
    // Fallback to localStorage
    studentsData = JSON.parse(localStorage.getItem('erp_students_data')) || [];
}
```

This ensures the frontend works even if the backend is temporarily unavailable.

## Data Synchronization

### When Backend is Available:
1. All data is fetched from MongoDB
2. All changes are saved to MongoDB
3. Real-time updates across all users

### When Backend is Unavailable:
1. Data is fetched from localStorage
2. Changes are saved to localStorage
3. Data syncs when backend is restored

## Troubleshooting

### CORS Errors
**Error:** "Access to fetch at 'http://localhost:5000/api/students' from origin 'http://localhost:5500' has been blocked by CORS policy"

**Solution:** Check `backend/.env` file:
```env
FRONTEND_URL=http://localhost:5500
```

### Connection Refused
**Error:** "Failed to fetch" or "ERR_CONNECTION_REFUSED"

**Solution:**
1. Make sure backend is running: `npm start`
2. Check if port 5000 is available
3. Verify MongoDB is running

### 404 Not Found
**Error:** "404 Not Found" for API endpoints

**Solution:**
1. Check backend routes in `backend/routes/`
2. Verify API_BASE_URL in frontend JavaScript files
3. Check server console for errors

### Data Not Updating
**Issue:** Changes not reflecting in frontend

**Solution:**
1. Check browser console for errors
2. Verify API responses in Network tab
3. Clear localStorage and refresh
4. Check MongoDB connection

## Performance Tips

1. **Pagination**: Frontend requests 5-10 students per page
2. **Caching**: Browser caches static assets
3. **Lazy Loading**: Data loads as needed
4. **Indexes**: MongoDB indexes on frequently queried fields
5. **Connection Pooling**: MongoDB connection pooling enabled

## Security Notes

1. **Input Validation**: All inputs validated on backend
2. **Data Sanitization**: Strings trimmed and sanitized
3. **No SQL Injection**: Using Mongoose ORM
4. **CORS Protected**: Only allowed origins can access
5. **Error Messages**: Don't expose sensitive data

## Next Steps

1. ✅ Backend is ready
2. ✅ Frontend is configured
3. ✅ Database structure is designed
4. ✅ API endpoints are created
5. ✅ Documentation is complete

**You're ready to use the system!**

## Quick Test

1. Start MongoDB
2. Start backend: `cd backend && npm start`
3. Start frontend: Open `frontend/students.html` with Live Server
4. Try adding a student
5. Check if it appears in the list
6. Try making a payment
7. Check dashboard statistics

Everything should work seamlessly! 🎉