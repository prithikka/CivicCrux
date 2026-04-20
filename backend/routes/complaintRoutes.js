const express = require('express');
const router = express.Router();
const { createComplaint, getMyComplaints, getOfficerComplaints, getComplaintById, updateComplaintStatus, getAllComplaints } = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, createComplaint);
router.get('/', protect, authorize('admin'), getAllComplaints);
router.get('/my', protect, getMyComplaints);
router.get('/officer', protect, authorize('officer', 'admin'), getOfficerComplaints);
router.get('/:id', protect, getComplaintById);
router.put('/:id/status', protect, authorize('officer', 'admin'), updateComplaintStatus);

module.exports = router;
