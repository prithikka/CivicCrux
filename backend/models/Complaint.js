const mongoose = require('mongoose');

const complaintSchema = mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        category: { type: String, required: true },
        ward: { type: String, required: true },
        location: { type: String, required: true },
        gpsCoordinates: {
            lat: { type: Number },
            lng: { type: Number }
        },
        imageUrl: { type: String },
        status: {
            type: String,
            enum: ['REPORTED', 'IN PROGRESS', 'RESOLVED', 'ESCALATED'],
            default: 'REPORTED'
        },
        reportedBy: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        resolutionImageUrl: { type: String },
        officerRemarks: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
