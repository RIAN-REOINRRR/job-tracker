const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedAt: { type: Date, default: Date.now }
});

const applicationSchema = new mongoose.Schema({
  applicationId: { type: String, unique: true },
  company: { type: String, required: true, trim: true },
  jobRole: { type: String, required: true, trim: true },
  jobType: { 
    type: String, 
    enum: ['Full-time', 'Internship', 'Contract'], 
    required: true 
  },
  appliedDate: { 
    type: Date, 
    required: true,
    validate: {
      validator: function(v) {
        return v <= new Date();
      },
      message: 'Applied date cannot be in the future'
    }
  },
  expectedSalary: { type: Number, default: null },
  notes: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['Applied', 'Interview', 'Offer', 'Accepted', 'Declined', 'Rejected'],
    default: 'Applied' 
  },
  followUpDate: { type: Date },
  statusHistory: [statusHistorySchema]
}, { timestamps: true });

// Auto-generate Application ID & set followUpDate prior to saving
applicationSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Set followUpDate = appliedDate + 7 days
    const applied = new Date(this.appliedDate);
    const followUp = new Date(applied);
    followUp.setDate(followUp.getDate() + 7);
    this.followUpDate = followUp;

    // Initial status history entry
    this.statusHistory.push({ status: 'Applied', changedAt: new Date() });

    // ID prefix generation: first 3 letters of company name uppercase
    const prefix = this.company.replace(/[^a-zA-Z]/g, '').padEnd(3, 'X').substring(0, 3).toUpperCase();
    
    // Count existing applications with matching prefix pattern
    const regex = new RegExp(`^JA-${prefix}-`);
    const count = await mongoose.model('Application').countDocuments({ applicationId: regex });
    const sequence = String(count + 1).padStart(3, '0');
    
    this.applicationId = `JA-${prefix}-${sequence}`;
  }
  next();
});

module.exports = mongoose.model('Application', applicationSchema);