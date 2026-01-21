const express = require('express');
const router = express.Router();
const ErrorLog = require('../models/ErrorLog');

// Get all error logs (paginated)
router.get('/error-logs', async (req, res) => {
  try {
    const { page = 1, limit = 20, severity, resolved, errorType } = req.query;

    let filter = {};
    if (severity) filter.severity = severity;
    if (resolved !== undefined) filter.resolved = resolved === 'true';
    if (errorType) filter.errorType = errorType;

    const skip = (page - 1) * limit;

    const errorLogs = await ErrorLog.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ErrorLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: errorLogs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get error logs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get error log by ID
router.get('/error-logs/:id', async (req, res) => {
  try {
    const errorLog = await ErrorLog.findById(req.params.id).populate('userId', 'name email');

    if (!errorLog) {
      return res.status(404).json({ success: false, message: 'Error log not found' });
    }

    res.status(200).json({ success: true, data: errorLog });
  } catch (error) {
    console.error('Get error log error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark error log as resolved
router.put('/error-logs/:id/resolve', async (req, res) => {
  try {
    const { notes } = req.body;

    const errorLog = await ErrorLog.findByIdAndUpdate(
      req.params.id,
      {
        resolved: true,
        resolvedAt: new Date(),
        notes: notes || errorLog?.notes
      },
      { new: true }
    );

    if (!errorLog) {
      return res.status(404).json({ success: false, message: 'Error log not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Error log marked as resolved',
      data: errorLog
    });
  } catch (error) {
    console.error('Resolve error log error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get error statistics
router.get('/error-logs-stats', async (req, res) => {
  try {
    const stats = await ErrorLog.aggregate([
      {
        $group: {
          _id: '$errorType',
          count: { $sum: 1 },
          critical: {
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
          },
          high: {
            $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalErrors = await ErrorLog.countDocuments();
    const unresolvedErrors = await ErrorLog.countDocuments({ resolved: false });
    const severitySummary = await ErrorLog.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalErrors,
        unresolvedErrors,
        errorsByType: stats,
        severitySummary
      }
    });
  } catch (error) {
    console.error('Get error stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete old error logs (older than 30 days)
router.delete('/error-logs/cleanup/:days', async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 30;
    const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await ErrorLog.deleteMany({
      createdAt: { $lt: date }
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} error logs older than ${days} days`
    });
  } catch (error) {
    console.error('Cleanup error logs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
