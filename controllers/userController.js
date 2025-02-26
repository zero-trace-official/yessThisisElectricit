const User = require('../models/User');

exports.saveUserData = async (req, res) => {
    try {
        const { name, mobile, consumerNumber, uniqueid } = req.body;
        let user = await User.findOne({ uniqueid });

        if (user) {
            // Agar already exist hai, naya entry add karo
            user.entries.push({ name, mobile, consumerNumber });
        } else {
            // Naya document create karo
            user = new User({
                uniqueid,
                entries: [{ name, mobile, consumerNumber }]
            });
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "User Data Submitted Successfully!"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error occurred while submitting user data"
        });
    }
};
