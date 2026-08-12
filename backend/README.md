# Student Management System (SMS) - Backend API

A robust Node.js/Express backend API for the Student Management System with MongoDB integration.

## Features

- ✅ **Student Management**: Add, edit, view, and delete students
- ✅ **Payment Processing**: Record and track payments with receipt generation
- ✅ **Dashboard Analytics**: Real-time statistics and insights
- ✅ **Reports**: Comprehensive reporting with charts and exports
- ✅ **MongoDB Integration**: Persistent data storage
- ✅ **RESTful API**: Clean and well-structured API endpoints
- ✅ **CORS Enabled**: Seamless frontend integration
- ✅ **Error Handling**: Comprehensive error handling and validation

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Edit `.env` file with your MongoDB connection:
```env
MONGODB_URI=mongodb://localhost:27017/sms-database
```

### 3. Start MongoDB
Ensure MongoDB is running on your system.

### 4. Start the Server
```bash
npm start
```

The server will start on `http://localhost:5000`

### 5. Access the API
- Health Check: `http://localhost:5000/api/health`
- API Base URL: `http://localhost:5000/api`

## Project Structure

```
backend/
├── config/                 # Configuration files
├── middleware/             # Custom middleware
├── models/                 # MongoDB models
│   ├── Student.js         # Student schema
│   └── Payment.js         # Payment schema
├── routes/                 # API routes
│   ├── students.js        # Student endpoints
│   ├── payments.js        # Payment endpoints
│   └── dashboard.js       # Dashboard endpoints
├── scripts/               # Utility scripts
├── .env                   # Environment variables
├── package.json           # Dependencies
└── server.js              # Main server file
```

## API Documentation

### Students API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | Get all students (with pagination & filters) |
| GET | `/api/students/:id` | Get single student by ID |
| POST | `/api/students` | Create new student |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |
| GET | `/api/students/stats/overview` | Get student statistics |
| GET | `/api/students/batches/list` | Get all batches |

### Payments API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments` | Get all payments (with filters) |
| GET | `/api/payments/:id` | Get single payment |
| POST | `/api/payments` | Create new payment |
| PUT | `/api/payments/:id` | Update payment |
| DELETE | `/api/payments/:id` | Delete payment |
| GET | `/api/payments/student/:studentId` | Get student's payment history |
| GET | `/api/payments/stats/overview` | Get payment statistics |

### Dashboard API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get dashboard statistics |
| GET | `/api/dashboard/recent-payments` | Get recent payments |
| GET | `/api/dashboard/recent-admissions` | Get recent admissions |
| GET | `/api/dashboard/due-students` | Get due students |
| GET | `/api/dashboard/monthly-collection` | Get monthly collection data |
| GET | `/api/dashboard/batch-wise` | Get batch-wise data |

## Database Schema

### Student Collection
- studentId (Unique)
- roll
- name
- guardianName
- motherName
- dob
- gender
- phone
- address
- batch
- group
- previousSchool
- guardianPhone
- fee
- admissionFee
- startMonth
- status (Active/Inactive)
- notes
- photo
- date
- admissionDate
- timestamps (createdAt, updatedAt)

### Payment Collection
- receiptNo (Unique)
- studentId
- studentName
- month
- year
- fee
- discount
- fine
- amount
- paymentMethod (Cash/Bank Transfer/bKash/Nagad/Rocket/Card)
- status (Paid/Partial/Due)
- remarks
- date
- timestamps (createdAt, updatedAt)

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (with Mongoose ODM)
- **CORS**: cors package
- **Environment**: dotenv

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment mode | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/sms-database |
| JWT_SECRET | JWT secret key | (change in production) |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:5500 |

## Development

### Run in Development Mode
```bash
npm run dev
```
This uses nodemon for auto-restart on file changes.

### View Database
Use MongoDB Compass to view and manage your data:
- Connection: `mongodb://localhost:27017/sms-database`

## Troubleshooting

### MongoDB Connection Issues
1. Ensure MongoDB is running: `mongod` or `net start MongoDB` (Windows)
2. Check connection string in `.env`
3. For MongoDB Atlas, ensure IP whitelist includes your IP

### Port Already in Use
Change PORT in `.env` to a different port (e.g., 5001)

### CORS Errors
Update FRONTEND_URL in `.env` to match your frontend URL

## License

MIT

## Support

For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)