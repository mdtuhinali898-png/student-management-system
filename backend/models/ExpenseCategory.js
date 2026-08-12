const mongoose = require('mongoose');

const expenseSubCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }
}, { _id: true });

const expenseCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subCategories: [expenseSubCategorySchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

expenseCategorySchema.index({ name: 1 });

module.exports = mongoose.model('ExpenseCategory', expenseCategorySchema);