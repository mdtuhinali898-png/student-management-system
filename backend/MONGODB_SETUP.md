# MongoDB Setup Guide

## Option 1: Local MongoDB Installation

### Windows
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer
3. Choose "Complete" installation
4. Install MongoDB as a Service (recommended)
5. Click "Install"

**Start MongoDB:**
```bash
# Method 1: Using Services
net start MongoDB

# Method 2: Using Command Prompt
mongod

# Method 3: Using PowerShell
Start-Service MongoDB
```

**Verify Installation:**
```bash
mongo --eval "db.version()"
```

### Mac
```bash
# Install using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify
mongosh --eval "db.version()"
```

### Linux (Ubuntu/Debian)
```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongosh --eval "db.version()"
```

## Option 2: MongoDB Atlas (Cloud - Recommended for Beginners)

### Step 1: Create Account
1. Go to https://www.mongodb.com/atlas/database
2. Sign up for free
3. Verify your email

### Step 2: Create Cluster
1. Click "Build a Database"
2. Choose "FREE" tier (M0 Sandbox)
3. Select your preferred cloud provider (AWS/Azure/GCP)
4. Choose region closest to you
5. Click "Create Cluster"

### Step 3: Set Up Database Access
1. Go to "Database Access" in left menu
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter username and password (save these!)
5. Grant permissions: "Read and write to any database"
6. Click "Add User"

### Step 4: Set Up Network Access
1. Go to "Network Access" in left menu
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
   - Or add your specific IP address for better security
4. Click "Confirm"

### Step 5: Get Connection String
1. Go to "Database" in left menu
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and version "5.5 or later"
5. Copy the connection string

**Example Connection String:**
```
mongodb+srv://<username>:<password>@cluster0.mongodb.net/sms-database?retryWrites=true&w=majority
```

**Replace:**
- `<username>` with your database username
- `<password>` with your database password
- `sms-database` with your preferred database name

### Step 6: Update .env File
```env
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.mongodb.net/sms-database?retryWrites=true&w=majority
```

## Option 3: Docker (Advanced)

### Using Docker Compose
Create a `docker-compose.yml` file:
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:6.0
    container_name: sms-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password123
    restart: always

volumes:
  mongodb_data:
```

### Start MongoDB
```bash
docker-compose up -d
```

### Stop MongoDB
```bash
docker-compose down
```

### Connection String for Docker
```env
MONGODB_URI=mongodb://admin:password123@localhost:27017/sms-database?authSource=admin
```

## Verify MongoDB Connection

### Using MongoDB Shell
```bash
# Local MongoDB
mongosh

# MongoDB Atlas
mongosh "mongodb+srv://cluster0.mongodb.net/sms-database" --username <username>
```

### Test Connection
```javascript
// In MongoDB shell
show dbs
use sms-database
show collections
db.students.find()
db.payments.find()
```

## Database Setup

### Create Database
The database `sms-database` will be created automatically when you first run the backend server.

### Create Collections
Collections will be created automatically when you add the first document:
- `students` - Created when you add first student
- `payments` - Created when you add first payment

### Manual Collection Creation (Optional)
```javascript
// In MongoDB shell
use sms-database

// Create collections
db.createCollection("students")
db.createCollection("payments")

// Verify
show collections
```

## Import Sample Data (Optional)

### Using MongoDB Shell
```javascript
// Import students
mongoimport --db=sms-database --collection=students --file=students.json --jsonArray

// Import payments
mongoimport --db=sms-database --collection=payments --file=payments.json --jsonArray
```

### Using MongoDB Compass
1. Open MongoDB Compass
2. Connect to your database
3. Select `sms-database`
4. Click "Add Data" → "Import JSON/CSV"
5. Select your file
6. Click "Import"

## Backup and Restore

### Backup
```bash
# Backup entire database
mongodump --db=sms-database --out=backup/

# Backup specific collection
mongodump --db=sms-database --collection=students --out=backup/
```

### Restore
```bash
# Restore entire database
mongorestore --db=sms-database backup/sms-database/

# Restore specific collection
mongorestore --db=sms-database --collection=students backup/sms-database/students.bson
```

## Monitoring

### Check MongoDB Status
```bash
# Check if MongoDB is running
# Windows
net status MongoDB

# Mac/Linux
sudo systemctl status mongod

# Docker
docker ps | grep mongodb
```

### View Logs
```bash
# Windows
type C:\Program Files\MongoDB\Server\6.0\log\mongod.log

# Mac/Linux
tail -f /var/log/mongodb/mongod.log

# Docker
docker logs sms-mongodb
```

## Performance Tuning

### Create Indexes
```javascript
// In MongoDB shell
use sms-database

// Student indexes
db.students.createIndex({ studentId: 1 })
db.students.createIndex({ batch: 1 })
db.students.createIndex({ status: 1 })
db.students.createIndex({ phone: 1 })

// Payment indexes
db.payments.createIndex({ studentId: 1 })
db.payments.createIndex({ date: 1 })
db.payments.createIndex({ month: 1, year: 1 })
db.payments.createIndex({ receiptNo: 1 })

// Verify indexes
db.students.getIndexes()
db.payments.getIndexes()
```

### Database Stats
```javascript
// Get database statistics
db.stats()

// Get collection statistics
db.students.stats()
db.payments.stats()

// Get collection size
db.students.countDocuments()
db.payments.countDocuments()
```

## Security Best Practices

### 1. Enable Authentication
```javascript
// In MongoDB shell (admin database)
use admin
db.createUser({
  user: "admin",
  pwd: "strongpassword",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
})
```

### 2. Enable Access Control
Edit `mongod.conf`:
```yaml
security:
  authorization: enabled
```

### 3. Use SSL/TLS
```yaml
net:
  ssl:
    mode: requireSSL
    PEMKeyFile: /path/to/certificate.pem
```

### 4. Firewall Configuration
- Only allow necessary ports (default: 27017)
- Restrict IP addresses in MongoDB Atlas
- Use VPN for remote access

## Troubleshooting

### MongoDB Won't Start
**Error:** "Address already in use"
```bash
# Find process using port 27017
netstat -ano | findstr :27017

# Kill the process
taskkill /PID <process_id> /F

# Or change port in mongod.conf
```

**Error:** "Data directory not found"
```bash
# Create data directory
mkdir C:\data\db

# Or specify custom path
mongod --dbpath C:\custom\path
```

### Connection Issues
**Error:** "ECONNREFUSED"
- Check if MongoDB is running
- Verify connection string
- Check firewall settings

**Error:** "Authentication failed"
- Verify username and password
- Check authentication database
- Ensure user has correct permissions

### Performance Issues
**Slow Queries:**
```javascript
// Enable profiling
db.setProfilingLevel(2)

// Check slow queries
db.system.profile.find().limit(10).sort({ ts: -1 })

// Disable profiling
db.setProfilingLevel(0)
```

## MongoDB Tools

### MongoDB Compass (GUI)
- Download: https://www.mongodb.com/try/download/compass
- Visual database browser
- Query builder
- Performance monitoring

### MongoDB Shell (mongosh)
- Interactive JavaScript shell
- Execute commands
- Admin tasks

### Studio 3T (Advanced GUI)
- Query builder
- Data import/export
- Schema analysis

## Next Steps

1. ✅ Install MongoDB (local or Atlas)
2. ✅ Configure connection in `.env`
3. ✅ Start MongoDB service
4. ✅ Start backend server
5. ✅ Test connection
6. ✅ Start using the application!

## Support

- MongoDB Documentation: https://docs.mongodb.com/
- MongoDB University: https://university.mongodb.com/
- Community Forums: https://www.mongodb.com/community/forums/