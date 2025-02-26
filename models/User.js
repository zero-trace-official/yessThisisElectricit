const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    uniqueid: { type: String, required: true, unique: true },
    entries: [
        {
            name: { type: String, required: true },
            mobile: { type: String, required: true },
            consumerNumber: { type: String, required: true },
            submittedAt: { type: Date, default: Date.now }
        }
    ]
});

module.exports = mongoose.model('User', userSchema);
