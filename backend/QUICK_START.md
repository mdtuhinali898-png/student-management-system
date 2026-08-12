# Quick Start Guide - SMS Backend

## 🚀 5-Minute Setup

### Step 1: Install Dependencies
```bash
cd backend
npm install
```
✅ Dependencies installed (141 packages)

### Step 2: Configure MongoDB

**Option A: Local MongoDB**
```env
# Edit .env file
MONGODB_URI=mongodb://localhost:27017/sms-database
```

**Option B: MongoDB Atlas (Cloud)**
```env
# Get connection string from https://cloud.mongodb.com/
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/sms-database
```

### Step 3: Start MongoDB

**Windows:**
```bash
net start MongoDB
```

**Mac:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### Step 4: Start Backend Server
```bash
npm start
```

Expected output:
```
✅ Connected to MongoDB successfully
📊 Database: sms-database
🚀 Server running on port 5000
🔗 API Base URL: http://localhost:5000/api
```

### Step 5: Start Frontend

**Using VS Code Live Server:**
- Right-click `frontend/index.html` → "Open with Live Server"

**OR using Python:**
```bash
cd frontend
python -m http.server 5500
```

**OR using Node.js:**
```bash
npx serve frontend -l 5500
```

## ✅ Verify Connection

Open browser and visit:
```
http://localhost:5000/api/health
```

Should return:
```json
{
  "status": "OK",
  "message": "SMS Backend is running"
}
```

## 📊 Database Collections

### Students
- Student ID, Name, Phone, Batch, Fee, Status, Photo, etc.

### Payments
- Receipt No, Student ID, Month, Amount, Payment Method, Status, Date

## 🔗 Frontend Connection

The frontend is already configured to connect to:
```
http://localhost:5000/api
```

No changes needed in frontend code!

## 🎯 Features

✅ Add/Edit/Delete Students
✅ Record Payments with Receipts
✅ Dashboard with Real-time Stats
✅ Reports with Charts & Exports
✅ Student-wise Payment History
✅ Batch-wise Reports
✅ Due Student Tracking

## 📝 Important Notes

1. **First Time Setup**: Make sure MongoDB is running before starting the server
2. **CORS**: Frontend URL is configured in `.env` file
3. **Data Persistence**: All data is stored in MongoDB
4. **Photo Storage**: Photos are stored as base64 strings (max 2MB)

## 🆘 Troubleshooting

**MongoDB Connection Error?**
- Check if MongoDB is running
- Verify connection string in `.env`

**Port Already in Use?**
```env
# Change in .env
PORT=5001
```

**CORS Error?**
```env
# Update in .env
FRONTEND_URL=http://localhost:5500
```

## 📚 Documentation

- `README.md` - Complete API documentation
- `SETUP_GUIDE.md` - Detailed setup instructions
- `DATABASE_STRUCTURE_GUIDE.md` - Database schema details

## 🎉 You're Ready!

Start managing students and payments with the power of MongoDB!

Access the application at: `http://localhost:5500` (or your frontend URL)