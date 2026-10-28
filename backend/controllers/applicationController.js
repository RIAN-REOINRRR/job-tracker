const Application = require('../models/Application');

const WORKFLOW = {
  Applied: ['Interview', 'Rejected'],
  Interview: ['Offer', 'Rejected'],
  Offer: ['Accepted', 'Declined'],
  Accepted: [],
  Declined: [],
  Rejected: []
};

const FINAL_STATUSES = ['Accepted', 'Declined', 'Rejected'];

// Get Applications with Search, Filter & Summary Stats
exports.getApplications = async (req, res) => {
  try {
    const { status, company } = req.query;
    let query = {};

    if (status) query.status = status;
    if (company) query.company = { $regex: company, $options: 'i' };

    const applications = await Application.find(query).sort({ createdAt: -1 });

    const updatedApps = applications.map(app => {
      const appObj = app.toObject();
      const now = new Date();
      appObj.isOverdue = app.status === 'Applied' && app.followUpDate < now;
      return appObj;
    });

    const counts = {
      Total: await Application.countDocuments(),
      Applied: await Application.countDocuments({ status: 'Applied' }),
      Interview: await Application.countDocuments({ status: 'Interview' }),
      Offer: await Application.countDocuments({ status: 'Offer' }),
      Accepted: await Application.countDocuments({ status: 'Accepted' }),
      Declined: await Application.countDocuments({ status: 'Declined' }),
      Rejected: await Application.countDocuments({ status: 'Rejected' })
    };

    return res.status(200).json({
      success: true,
      message: 'Applications retrieved successfully',
      data: { applications: updatedApps, counts }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
};

// Create Application
exports.createApplication = async (req, res) => {
  try {
    const { company, jobRole, jobType, appliedDate, expectedSalary, notes } = req.body;

    if (new Date(appliedDate) > new Date()) {
      return res.status(400).json({ success: false, message: 'Applied date cannot be in the future', data: null });
    }

    // Duplicate Check: Same Company and Job Role active (not in final status)
    const existing = await Application.findOne({
      company: { $regex: `^${company.trim()}$`, $options: 'i' },
      jobRole: { $regex: `^${jobRole.trim()}$`, $options: 'i' },
      status: { $nin: FINAL_STATUSES }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An active application for this company and role already exists.',
        data: null
      });
    }

    const application = new Application({ company, jobRole, jobType, appliedDate, expectedSalary, notes });
    await application.save();

    return res.status(201).json({ success: true, message: 'Application created successfully', data: application });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message, data: null });
  }
};

// Edit Application (Editable: company, jobRole, jobType, expectedSalary, notes)
exports.updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { company, jobRole, jobType, expectedSalary, notes } = req.body;

    const app = await Application.findById(id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found', data: null });

    if (company) app.company = company;
    if (jobRole) app.jobRole = jobRole;
    if (jobType) app.jobType = jobType;
    if (expectedSalary !== undefined) app.expectedSalary = expectedSalary;
    if (notes !== undefined) app.notes = notes;

    await app.save();
    return res.status(200).json({ success: true, message: 'Application updated successfully', data: app });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message, data: null });
  }
};

// Update Status (Workflow State Engine)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { nextStatus } = req.body;

    const app = await Application.findById(id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found', data: null });

    const allowedNext = WORKFLOW[app.status] || [];
    if (!allowedNext.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${app.status} to ${nextStatus}. Allowed: [${allowedNext.join(', ')}]`,
        data: null
      });
    }

    app.status = nextStatus;
    app.statusHistory.push({ status: nextStatus, changedAt: new Date() });
    await app.save();

    return res.status(200).json({ success: true, message: 'Status updated successfully', data: app });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
};

// Delete Application Rule
exports.deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const app = await Application.findById(id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found', data: null });

    if (['Interview', 'Offer'].includes(app.status)) {
      return res.status(400).json({
        success: false,
        message: 'Applications in Interview or Offer status cannot be deleted.',
        data: null
      });
    }

    await Application.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Application deleted successfully', data: null });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
};