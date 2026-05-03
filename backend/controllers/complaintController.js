const Complaint = require('../models/Complaint');

const createComplaint = async (req, res) => {
    try {
        const { title, description, category, ward, location, lat, lng, imageUrl } = req.body;
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
        const complaints = await Complaint.find({ reportedBy: req.user._id }).populate('assignedTo', 'name username');
        res.json(complaints);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getOfficerComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({ ward: req.user.ward }).populate('reportedBy', 'name username');
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

        if (req.user.role === 'officer' && complaint.ward !== req.user.ward) {
            return res.status(403).json({ message: 'Not authorized to update complaints outside your ward' });
        }

        if (status && complaint.status !== status) {
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

module.exports = { createComplaint, getMyComplaints, getOfficerComplaints, getComplaintById, updateComplaintStatus, getAllComplaints, raiseComplaint };
