const Complaint = require('../models/Complaint');
const User = require('../models/User');


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
        const complaints = await Complaint.find({ reportedBy: req.user._id }).populate('assignedTo', 'name username');
        res.json(complaints);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getOfficerComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({
            $or: [
                { ward: req.user.ward, reassignedOnce: false },
                { assignedTo: req.user._id }
            ]
        }).populate('reportedBy', 'name username');
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

        if (req.user.role === 'officer' && complaint.ward !== req.user.ward && complaint.assignedTo?.toString() !== req.user._id.toString()) {
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
            if (complaint.ward !== req.user.ward && complaint.assignedTo?.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to update complaints outside your ward' });
            }
            if (complaint.status === 'REOPENED' || complaint.status === 'ESCALATED') {
                return res.status(403).json({ message: 'Cannot update: Issue is read-only (REOPENED/ESCALATED)' });
            }
            if (status === 'REPORTED' && complaint.status === 'IN PROGRESS') {
                return res.status(400).json({ message: 'Cannot move IN_PROGRESS issue back to REPORTED' });
            }
            if (status === 'IN PROGRESS' && complaint.status === 'RESOLVED') {
                return res.status(400).json({ message: 'Cannot move RESOLVED issue back to IN_PROGRESS' });
            }
            if (status === 'REPORTED' && complaint.status === 'RESOLVED') {
                return res.status(400).json({ message: 'Cannot move RESOLVED issue back to REPORTED' });
            }
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

const reassignComplaint = async (req, res) => {
    try {
        const { assignedTo, ward } = req.body;
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        if (complaint.reassignedOnce) {
            return res.status(400).json({ message: 'Complaint has already been reassigned once.' });
        }

        const previousOfficer = complaint.assignedTo ? await User.findById(complaint.assignedTo) : null;
        const previousOfficerName = previousOfficer ? (previousOfficer.username || previousOfficer.name) : 'Unassigned';
        const newOfficer = await User.findById(assignedTo);
        const newOfficerName = newOfficer ? (newOfficer.username || newOfficer.name) : 'Unknown Officer';

        complaint.assignedTo = assignedTo;
        complaint.reassignedOnce = true;
        // Original ward context is kept so it maintains logical boundary association unless explicitly filtering to solely user.

        complaint.history.push({
            status: complaint.status,
            note: `Reassigned from ${previousOfficerName} to ${newOfficerName} by Admin`,
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
