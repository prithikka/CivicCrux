const Complaint = require('../models/Complaint');

const checkEscalations = async () => {
    try {
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const toEscalate = await Complaint.find({ status: 'REPORTED', createdAt: { $lte: fourteenDaysAgo } });

        for (const c of toEscalate) {
            c.status = 'ESCALATED';
            c.assignedTo = null; // Unassign from officer
            c.history.push({
                status: 'ESCALATED',
                note: 'Automatically escalated due to 14 days of inactivity',
                changedByRole: 'system'
            });
            await c.save();
        }
    } catch (error) {
        console.error('Error checking escalations:', error);
    }
};

const createComplaint = async (req, res) => {
    try {
        const { title, description, category, ward, location, lat, lng, imageUrl } = req.body;

        if (!imageUrl) return res.status(400).json({ message: 'upload image' });
        if (!ward) return res.status(400).json({ message: 'area missing' });
        if (!description) return res.status(400).json({ message: 'description required' });

        const complaint = new Complaint({
            title, description, category, ward, location,
            gpsCoordinates: (lat && lng) ? { lat, lng } : null,
            imageUrl, reportedBy: req.user._id, status: 'REPORTED',
            history: [{
                status: 'REPORTED',
                note: 'Complaint registered successfully',
                changedByRole: req.user.role || 'citizen',
                changedBy: req.user._id
            }]
        });
        const createdComplaint = await complaint.save();
        res.status(201).json(createdComplaint);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getMyComplaints = async (req, res) => {
    try {
        await checkEscalations();
        const complaints = await Complaint.find({ reportedBy: req.user._id }).populate('assignedTo', 'name username');
        res.json(complaints);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getOfficerComplaints = async (req, res) => {
    try {
        await checkEscalations();
        // Officers shouldn't see escalated or reopened issues directly unless assigned to them.
        // Actually, if we set assignedTo=null, they might still see them if we only check `ward`.
        // Let's ensure officers don't see ESCALATED and REOPENED issues unless they are specifically assigned to them by admin, or just generally filter them.
        // The requirements state: "Escalated issues should no longer remain under the same ward officer until reassigned."
        // "Admin can reassign the reopened issue to a ward officer."
        // Let's filter out issues where status is ESCALATED or REOPENED and assignedTo is NOT the current officer.
        const allWardComplaints = await Complaint.find({ ward: req.user.ward }).populate('reportedBy', 'name username');

        const complaints = allWardComplaints.filter(c => {
            if (['ESCALATED', 'REOPENED'].includes(c.status)) {
                return c.assignedTo && c.assignedTo.toString() === req.user._id.toString();
            }
            return true;
        });

        res.json(complaints);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getComplaintById = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id)
            .populate('reportedBy', 'name username email')
            .populate('assignedTo', 'name username')
            .populate('history.changedBy', 'name username');

        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        if (req.user.role === 'officer' && complaint.ward !== req.user.ward) {
            return res.status(403).json({ message: 'Not authorized to view complaints outside your ward' });
        }
        res.json(complaint);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateComplaintStatus = async (req, res) => {
    try {
        const { status, resolutionImageUrl, officerRemarks } = req.body;
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        if (req.user.role === 'officer') {
            if (complaint.ward !== req.user.ward) {
                return res.status(403).json({ message: 'Not authorized to update complaints outside your ward' });
            }
            if (['ESCALATED', 'REOPENED'].includes(complaint.status) && (!complaint.assignedTo || complaint.assignedTo.toString() !== req.user._id.toString())) {
                return res.status(403).json({ message: 'Not authorized to update this reassigned complaint' });
            }
        }

        if (status && complaint.status !== status) {
            // Strict forward-only status flow
            const validTransitions = {
                'REPORTED': ['IN PROGRESS'],
                'IN PROGRESS': ['RESOLVED'],
                'RESOLVED': [],
                'ESCALATED': ['IN PROGRESS', 'RESOLVED'], // Allow reassigned officer to work on it
                'REOPENED': ['IN PROGRESS', 'RESOLVED']   // Allow reassigned officer to work on it
            };

            if (!validTransitions[complaint.status] || !validTransitions[complaint.status].includes(status)) {
                return res.status(400).json({ message: `Invalid status transition from ${complaint.status} to ${status}` });
            }

            complaint.status = status;
            complaint.history.push({
                status: status,
                note: officerRemarks || `Status updated to ${status}`,
                changedByRole: req.user.role,
                changedBy: req.user._id
            });
        }
        if (resolutionImageUrl) complaint.resolutionImageUrl = resolutionImageUrl;
        if (officerRemarks !== undefined) complaint.officerRemarks = officerRemarks;

        if (!complaint.assignedTo && req.user.role === 'officer') {
            complaint.assignedTo = req.user._id;
        }

        const updatedComplaint = await complaint.save();
        res.json(updatedComplaint);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getAllComplaints = async (req, res) => {
    try {
        await checkEscalations();
        const complaints = await Complaint.find().populate('reportedBy', 'name username email').populate('assignedTo', 'name username');
        res.json(complaints);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const raiseComplaint = async (req, res) => {
    try {
        const { reason } = req.body;
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        if (req.user.role !== 'citizen' || complaint.reportedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to raise a follow-up for this complaint' });
        }

        if (complaint.status !== 'RESOLVED') {
            return res.status(400).json({ message: 'Can only raise follow-up on resolved complaints' });
        }

        complaint.status = 'REOPENED';
        complaint.assignedTo = null; // Remove previous officer mapping
        complaint.history.push({
            status: 'REOPENED',
            note: reason || 'Citizen is not satisfied with the resolution',
            changedByRole: 'citizen',
            changedBy: req.user._id
        });

        const updatedComplaint = await complaint.save();
        res.json(updatedComplaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const reassignComplaint = async (req, res) => {
    try {
        const { assignedTo } = req.body;
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        if (complaint.reassignedOnce) {
            return res.status(400).json({ message: 'Complaint has already been reassigned once.' });
        }

        complaint.assignedTo = assignedTo;
        complaint.reassignedOnce = true;

        complaint.history.push({
            status: complaint.status,
            note: 'Complaint reassigned by Admin',
            changedByRole: 'admin',
            changedBy: req.user._id
        });

        const updatedComplaint = await complaint.save();
        res.json(updatedComplaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createComplaint, getMyComplaints, getOfficerComplaints, getComplaintById, updateComplaintStatus, getAllComplaints, raiseComplaint, reassignComplaint };
