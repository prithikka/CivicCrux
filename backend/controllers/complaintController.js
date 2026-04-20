const Complaint = require('../models/Complaint');

const createComplaint = async (req, res) => {
    try {
        const { title, description, category, ward, location, lat, lng, imageUrl } = req.body;
        const complaint = new Complaint({
            title, description, category, ward, location,
            gpsCoordinates: (lat && lng) ? { lat, lng } : null,
            imageUrl, reportedBy: req.user._id, status: 'REPORTED'
        });
        const createdComplaint = await complaint.save();
        res.status(201).json(createdComplaint);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getMyComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({ reportedBy: req.user._id }).populate('assignedTo', 'name');
        res.json(complaints);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getOfficerComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({ ward: req.user.ward }).populate('reportedBy', 'name');
        res.json(complaints);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getComplaintById = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id)
            .populate('reportedBy', 'name email')
            .populate('assignedTo', 'name');

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

        if (status) complaint.status = status;
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
        const complaints = await Complaint.find().populate('reportedBy', 'name email').populate('assignedTo', 'name');
        res.json(complaints);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { createComplaint, getMyComplaints, getOfficerComplaints, getComplaintById, updateComplaintStatus, getAllComplaints };
