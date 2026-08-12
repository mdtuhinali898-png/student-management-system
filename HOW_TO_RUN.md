# How to Run the Student Management System

## Prerequisites
- Backend server is running on port 5000
- MongoDB is connected (already configured)

## IMPORTANT: How to Access the Application

### ❌ WRONG WAY (Don't do this):
- Don't open HTML files directly by double-clicking them
- Don't use: `file:///D:/SMS/frontend/students.html`
- This will cause CORS errors and data won't load

### ✅ CORRECT WAY (Do this):

1. **Make sure the backend server is running:**
   - You should see in the terminal: "Server running on port 5000"
   - If not, run: `node backend\server.js`

2. **Open your browser and go to:**
   ```
   http://localhost:5000
   ```
   
   Or directly access any page:
   - Dashboard: `http://localhost:5000/dashboard.html`
   - Students: `http://localhost:5000/students.html`
   - Add Student: `http://localhost:5000/add-student.html`
   - Payments: `http://localhost:5000/payments.html`

3. **The application will work correctly because:**
   - Frontend JavaScript makes API calls to: `http://localhost:5000/api/*`
   - Backend serves the HTML files
   - CORS is properly configured

## Testing the Connection

You can test if the API is working by visiting:
- `http://localhost:5000/api/health` - Should show: `{"status":"OK","message":"SMS Backend is running"}`
- `http://localhost:5000/api/students` - Should show student data (empty array if no students added yet)

## Adding Your First Student

1. Go to: `http://localhost:5000/add-student.html`
2. Fill in the student information
3. Click "Add Student" button
4. The student will be saved to MongoDB
5. Go to `http://localhost:5000/students.html` to see the list

## Troubleshooting

### Problem: "No data showing" or "Failed to load"
**Solution:** Make sure you're accessing via `http://localhost:5000` not `file://`

### Problem: "Cannot connect to server"
**Solution:** 
1. Check if backend is running (terminal should show "Server running on port 5000")
2. If not, run: `node backend\server.js`

### Problem: "MongoDB connection error"
**Solution:** Check your internet connection (MongoDB Atlas requires internet)

## Quick Start

```bash
# 1. Start the backend server (if not already running)
node backend\server.js

# 2. Open browser and go to
http://localhost:5000

# 3. That's it! The application is now running
```

## Notes

- Keep the terminal window open while using the application
- The backend server must be running for the frontend to work
- All data is stored in MongoDB Atlas cloud database
- You can access from any page on your computer using `http://localhost:5000`