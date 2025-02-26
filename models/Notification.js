// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    timestamp: { type: String, required: true }, 
    uniqueid: { type: String, required: true }
});

module.exports = mongoose.model('Notification', notificationSchema);