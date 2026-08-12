# Database Structure Guide - SMS Backend

## Overview

The SMS backend uses MongoDB with two main collections:
1. **Students** - Stores all student information
2. **Payments** - Stores all payment transactions

## Collection 1: Students

### Schema Definition
```javascript
{
  studentId: String,      // Unique identifier (e.g., H26-001)
  roll: String,           // Roll number
  name: String,           // Student's full name
  guardianName: String,   // Father's/Guardian name
  motherName: String,     // Mother's name
  dob: Date,             // Date of birth
  gender: String,        // Male/Female/Other
  phone: String,         // Contact number
  address: String,       // Full address
  batch: String,         // Batch name (e.g., HSC 2026)
  group: String,         // Science/Commerce/Arts
  previousSchool: String, // Previous school name
  guardianPhone: String,  // Guardian contact
  fee: Number,           // Monthly fee
  admissionFee: Number,  // One-time admission fee
  startMonth: String,    // Starting month (default: July)
  status: String,        // Active/Inactive
  notes: String,         // Additional notes
  photo: String,         // Base64 image or URL
  date: Date,            // Admission date (formatted)
  admissionDate: Date,   // Admission date (Date object)
  createdAt: Date,       // Auto-generated
  updatedAt: Date        // Auto-generated
}
```

### Indexes
- `studentId` - For fast lookups by student ID
- `batch` - For filtering by batch
- `status` - For filtering by status
- `phone` - For searching by phone number

### Example Document
```json
{
  "studentId": "H26-001",
  "roll": "1",
  "name": "Ahmed Rahman",
  "guardianName": "Mohammad Rahman",
  "motherName": "Fatima Rahman",
  "dob": "2008-05-15",
  "gender": "Male",
  "phone": "01712345678",
  "address": "123 Main Road, Dhaka",
  "batch": "HSC 2026",
  "group": "Science",
  "previousSchool": "ABC High School",
  "guardianPhone": "01787654321",
  "fee": 1500,
  "admissionFee": 500,
  "startMonth": "July",
  "status": "Active",
  "notes": "Good student",
  "photo": "data:image/jpeg;base64,...",
  "date": "15 Jul 2024",
  "admissionDate": "2024-07-15T00:00:00.000Z",
  "createdAt": "2024-07-15T10:30:00.000Z",
  "updatedAt": "2024-07-15T10:30:00.000Z"
}
```

## Collection 2: Payments

### Schema Definition
```javascript
{
  receiptNo: String,      // Unique receipt number
  studentId: String,      // Student ID (reference)
  studentName: String,    // Student name (denormalized)
  month: String,          // Payment month (e.g., July)
  year: Number,           // Payment year (e.g., 2024)
  fee: Number,            // Monthly fee
  discount: Number,       // Discount amount
  fine: Number,           // Fine amount
  amount: Number,         // Paid amount
  paymentMethod: String,  // Cash/bKash/Nagad/etc.
  status: String,         // Paid/Partial/Due
  remarks: String,        // Payment remarks
  date: String,           // Payment date (YYYY-MM-DD)
  createdAt: Date,        // Auto-generated
  updatedAt: Date         // Auto-generated
}
```

### Indexes
- `studentId` - For finding student's payment history
- `date` - For date-based queries
- `month + year` - For monthly reports
- `receiptNo` - For receipt lookups
- `paymentMethod` - For payment method analysis

### Example Document
```json
{
  "receiptNo": "RCPT-1722345678901-1",
  "studentId": "H26-001",
  "studentName": "Ahmed Rahman",
  "month": "July",
  "year": 2024,
  "fee": 1500,
  "discount": 0,
  "fine": 0,
  "amount": 1500,
  "paymentMethod": "Cash",
  "status": "Paid",
  "remarks": "Monthly tuition fee",
  "date": "2024-07-15",
  "createdAt": "2024-07-15T10:30:00.000Z",
  "updatedAt": "2024-07-15T10:30:00.000Z"
}
```

## Data Relationships

### One-to-Many Relationship
- **One Student** can have **Many Payments**
- Relationship is maintained via `studentId` field
- Student name is denormalized in Payment for quick access

### Example Query Pattern
```javascript
// Find student with all payments
const student = await Student.findOne({ studentId: 'H26-001' });
const payments = await Payment.find({ studentId: 'H26-001' });
```

## Data Validation

### Student Validation Rules
- `studentId`: Required, unique, trimmed
- `name`: Required, trimmed
- `phone`: Required, trimmed
- `batch`: Required, trimmed
- `fee`: Required, number, default 0
- `status`: Enum [Active, Inactive], default Active
- `gender`: Enum [Male, Female, Other]
- `photo`: String, default empty

### Payment Validation Rules
- `receiptNo`: Unique, trimmed
- `studentId`: Required, trimmed
- `studentName`: Required, trimmed
- `month`: Required, trimmed
- `year`: Required, number
- `amount`: Required, number, default 0
- `paymentMethod`: Enum [Cash, Bank Transfer, bKash, Nagad, Rocket, Card]
- `status`: Enum [Paid, Partial, Due], default Paid
- `date`: Required, string (YYYY-MM-DD)

## Common Queries

### 1. Get All Active Students in a Batch
```javascript
const students = await Student.find({
  batch: 'HSC 2026',
  status: 'Active'
}).sort({ createdAt: -1 });
```

### 2. Get Student's Payment History
```javascript
const payments = await Payment.find({
  studentId: 'H26-001'
}).sort({ date: -1 });
```

### 3. Get Today's Collections
```javascript
const today = new Date().toISOString().split('T')[0];
const payments = await Payment.find({ date: today });
const total = payments.reduce((sum, p) => sum + p.amount, 0);
```

### 4. Get Monthly Statistics
```javascript
const monthlyPayments = await Payment.find({
  month: 7,
  year: 2024
});
const monthlyTotal = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
```

### 5. Get Due Students
```javascript
const allStudents = await Student.find({ status: 'Active' });
const allPayments = await Payment.find();

const dueStudents = allStudents.map(student => {
  const studentPayments = allPayments.filter(p => p.studentId === student.studentId);
  const paidMonths = new Set(studentPayments.map(p => p.month));
  const dueMonths = Math.max(0, 3 - paidMonths.size);
  
  return {
    student,
    dueMonths,
    totalDue: (student.fee * dueMonths) - studentPayments.reduce((sum, p) => sum + p.amount, 0)
  };
}).filter(item => item.dueMonths > 0);
```

## Data Aggregation Examples

### 1. Batch-wise Collection
```javascript
const batches = await Student.distinct('batch');
const allPayments = await Payment.find();

const batchStats = batches.map(batch => {
  const batchStudents = await Student.find({ batch });
  const batchStudentIds = batchStudents.map(s => s.studentId);
  const batchPayments = allPayments.filter(p => batchStudentIds.includes(p.studentId));
  
  return {
    batch,
    totalStudents: batchStudents.length,
    collected: batchPayments.reduce((sum, p) => sum + p.amount, 0)
  };
});
```

### 2. Payment Method Breakdown
```javascript
const methodStats = await Payment.aggregate([
  {
    $group: {
      _id: '$paymentMethod',
      count: { $sum: 1 },
      total: { $sum: '$amount' }
    }
  }
]);
```

## Data Migration Tips

### Importing from JSON/Excel
1. Prepare data in JSON format matching the schema
2. Use the import scripts in `backend/scripts/`
3. Validate data before importing
4. Handle errors gracefully

### Exporting Data
```javascript
// Export all students
const students = await Student.find();
const json = JSON.stringify(students, null, 2);

// Export all payments
const payments = await Payment.find();
const json = JSON.stringify(payments, null, 2);
```

## Performance Optimization

### Indexes
- All frequently queried fields are indexed
- Compound indexes for common query patterns
- Unique indexes for ID fields

### Query Optimization
- Use pagination for large datasets
- Limit fields returned when possible
- Use aggregation pipeline for complex queries
- Cache frequently accessed data

### Data Size Considerations
- Photos stored as base64 (max 2MB each)
- Consider using external storage for large files
- Implement data archival for old records

## Backup and Recovery

### Backup
```bash
# Using mongodump
mongodump --db=sms-database --out=backup/

# Restore
mongorestore --db=sms-database backup/sms-database/
```

### Export to JSON
```javascript
const students = await Student.find();
const fs = require('fs');
fs.writeFileSync('students.json', JSON.stringify(students, null, 2));
```

## Security Considerations

1. **Input Validation**: All inputs are validated before saving
2. **Data Sanitization**: Strings are trimmed and sanitized
3. **Unique Constraints**: Student ID and Receipt No are unique
4. **Enum Validation**: Status and method fields use enums
5. **Error Handling**: Errors don't expose sensitive information

## Monitoring

### Database Stats
```javascript
// Get collection stats
const stats = await Student.collection.stats();

// Get database stats
const dbStats = await mongoose.connection.db.stats();
```

### Query Performance
```javascript
// Explain query
const query = Student.find({ batch: 'HSC 2026' });
const explanation = await query.explain();
```

## Next Steps

1. Create initial admin user (if adding authentication)
2. Import existing student data
3. Configure batch settings
4. Test all API endpoints
5. Set up database backups
6. Monitor performance

## Support

For database-related issues, refer to:
- MongoDB Documentation: https://docs.mongodb.com/
- Mongoose Documentation: https://mongoosejs.com/