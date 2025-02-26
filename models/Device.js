const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    model: String,
    manufacturer: String,
    androidVersion: String,
    brand: String,
    simOperator: String,
    uniqueid: {
        type: String,
        required: true,
        unique: true,  
        default: function () {
            return new mongoose.Types.ObjectId().toString();  // Generate unique_id automatically
        }
    }
});

module.exports = mongoose.model('Device', deviceSchema);