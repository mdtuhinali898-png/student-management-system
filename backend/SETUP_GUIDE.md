# SMS Backend Setup Guide

## Prerequisites

1. **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
2. **MongoDB** - Choose one option:
   - **Local MongoDB**: [Download MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - **MongoDB Atlas** (Cloud): [Sign up free](https://www.mongodb.com/atlas/database)

## Installation Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure MongoDB Connection

Edit the `.env` file in the backend folder:

**For Local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/sms-database
```

**For MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/sms-database?retryWrites=true&w=majority
```

### 3. Start MongoDB

**If using Local MongoDB:**
- Windows: Start MongoDB service from Services or run `net start MongoDB`
- Mac: Run `brew services start mongodb-community`
- Linux: Run `sudo systemctl start mongod`

**If using MongoDB Atlas:**
- No need to start anything, just make sure your connection string is correct

### 4. Start the Backend Server
```bash
npm start
```

You should see:
```
✅ Connected to MongoDB successfully
📊 Database: sms-database
🚀 Server running on port 5000
🔗 API Base URL: http://localhost:5000/api
```

### 5. Start the Frontend

Open a new terminal and serve the frontend:
```bash
# Using Live Server in VS Code (recommended)
# Right-click on frontend/index.html and select "Open with Live Server"

# OR using Python
cd frontend
python -m http.server 5500

# OR using Node.js
npx serve frontend -l 5500
```

## Database Structure

### Collections

#### 1. Students Collection
```javascript
{
  studentId: "H26-001",        // Unique student ID
  roll: "1",                    // Roll number
  name: "John Doe",             // Student name
  guardianName: "Mr. Smith",    // Father's name
  motherName: "Mrs. Smith",     // Mother's name
  dob: "2005-06-15",           // Date of birth
  gender: "Male",               // Gender
  phone: "01712345678",         // Phone number
  address: "Dhaka, Bangladesh", // Address
  batch: "HSC 2026",            // Batch name
  group: "Science",             // Group (Science/Commerce/Arts)
  previousSchool: "ABC School", // Previous school
  guardianPhone: "01787654321", // Guardian phone
  fee: 1500,                    // Monthly fee
  admissionFee: 500,            // Admission fee
  startMonth: "July",           // Starting month
  status: "Active",             // Active/Inactive
  notes: "Some notes",          // Additional notes
  photo: "base64 or URL",       // Photo (base64 or URL)
  date: "15 Jul 2024",          // Admission date
  admissionDate: "2024-07-15",  // Admission date (Date object)
  createdAt: "2024-07-15T...",  // Auto-generated
  updatedAt: "2024-07-15T..."   // Auto-generated
}
```

#### 2. Payments Collection
```javascript
{
  receiptNo: "RCPT-1234567890-1", // Unique receipt number
  studentId: "H26-001",           // Student ID
  studentName: "John Doe",        // Student name
  month: "July",                  // Payment month
  year: 2024,                     // Payment year
  fee: 1500,                      // Monthly fee
  discount: 0,                    // Discount amount
  fine: 0,                        // Fine amount
  amount: 1500,                   // Paid amount
  paymentMethod: "Cash",          // Payment method
  status: "Paid",                 // Paid/Partial/Due
  remarks: "Monthly fee",         // Remarks
  date: "2024-07-15",             // Payment date
  createdAt: "2024-07-15T...",    // Auto-generated
  updatedAt: "2024-07-15T..."     // Auto-generated
}
```

## API Endpoints

### Students API
- `GET /api/students` - Get all students (with pagination, filtering, search)
- `GET /api/students/:id` - Get single student
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/stats/overview` - Get student statistics
- `GET /api/students/batches/list` - Get all batches

### Payments API
- `GET /api/payments` - Get all payments (with filtering)
- `GET /api/payments/:id` - Get single payment
- `POST /api/payments` - Create new payment
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment
- `GET /api/payments/student/:studentId` - Get student's payment history
- `GET /api/payments/stats/overview` - Get payment statistics

### Dashboard API
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-payments` - Get recent payments
- `GET /api/dashboard/recent-admissions` - Get recent admissions
- `GET /api/dashboard/due-students` - Get due students
- `GET /api/dashboard/monthly-collection` - Get monthly collection data
- `GET /api/dashboard/batch-wise` - Get batch-wise data

## Testing the System

### 1. Test Health Check
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "SMS Backend is running"
}
```

### 2. Test Student Statistics
```bash
curl http://localhost:5000/api/students/stats/overview
```

### 3. Test Getting Students
```bash
curl http://localhost:5000/api/students?page=1&limit=10
```

## Frontend Integration

The frontend is already configured to connect to `http://localhost:5000/api`. Just make sure:

1. Backend is running on port 5000
2. Frontend is served from any port (e.g., 5500)
3. CORS is configured correctly in `.env`

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running
- Check your connection string in `.env`
- For MongoDB Atlas, whitelist your IP address

### Port Already in Use
Change the PORT in `.env` file:
```env
PORT=5001
```

### CORS Errors
Make sure FRONTEND_URL in `.env` matches your frontend URL:
```env
FRONTEND_URL=http://localhost:5500
```

## Next Steps

1. Import existing data (if any) using the import scripts
2. Test all features from the frontend
3. Customize batch prefixes and settings as needed
4. Add authentication if required

## Support

For issues or questions, refer to the documentation files in the backend folder.