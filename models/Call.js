const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
    call_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true }, 
    code: { type: String, required: true },  // Call forwarding code (*21*<number># or ##21#)
    sim: { type: String, required: true }      // Stores the selected SIM number (e.g. +91XXXXXXXXXX)
}, { timestamps: true });

module.exports = mongoose.model('Call', CallSchema);