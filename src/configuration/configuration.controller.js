import Configuration from "./db/configuration.js"

export const add = async (req, res, next) => {
    try {
        let payload = req?.body;
        if (accountNumber) {
            if (!bankName || !ifscCode || !bankAddress || !accountHolderName) {
                return res.status(400).json({
                    success: false,
                    message: `Bank details should be valid!`,
                })
            }
        }
        if (finderFee && !finderFeeType) {
            return res.status(400).json({
                success: false,
                message: `Finder fee should be valid!`,
            })
        }
        if (payload?.faq && !Array.isArray(payload?.faq)) {
            return res.status(400).json({
                success: false,
                message: "Frequently ask question should be array!",
            })
        } else if (payload?.faq && Array.isArray(payload?.faq) && !payload?.faq?.every(el => el.heading && el.content)) {
            return res.status(400).json({
                success: false,
                message: "Frequently ask question should be valid!",
            })
        }
        if (payload?.aboutus && !Array.isArray(payload?.aboutus)) {
            return res.status(400).json({
                success: false,
                message: "About us should be array!",
            })
        } else if (payload?.aboutus && Array.isArray(payload?.aboutus) && !payload?.aboutus?.every(el => el.heading && el.content)) {
            return res.status(400).json({
                success: false,
                message: "About us should be valid!",
            })
        }
        if (payload?.tandc && !Array.isArray(payload?.tandc)) {
            return res.status(400).json({
                success: false,
                message: "Term and condition should be array!",
            })
        } else if (payload?.tandc && Array.isArray(payload?.tandc) && !payload?.tandc?.every(el => el.heading && el.content)) {
            return res.status(400).json({
                success: false,
                message: "Term and condition should be valid!",
            })
        }
        if (payload?.shippingpolicy && !Array.isArray(payload?.shippingpolicy)) {
            return res.status(400).json({
                success: false,
                message: "Shipping policy should be array!",
            })
        } else if (payload?.shippingpolicy && Array.isArray(payload?.shippingpolicy) && !payload?.shippingpolicy?.every(el => el.heading && el.content)) {
            return res.status(400).json({
                success: false,
                message: "Shipping policy should be valid!",
            })
        }
        if (payload?.cancelpolicy && !Array.isArray(payload?.cancelpolicy)) {
            return res.status(400).json({
                success: false,
                message: "Cancellation policy should be array!",
            })
        } else if (payload?.cancelpolicy && Array.isArray(payload?.cancelpolicy) && !payload?.cancelpolicy?.every(el => el.heading && el.content)) {
            return res.status(400).json({
                success: false,
                message: "Cancellation policy should be valid!",
            })
        }
        let data = await Configuration.create({
            "bapId": payload?.bapId || "buyer-app-stage.thewitslab.com",
            "name": payload?.name,
            "logo": payload?.logo,
            "color": payload?.color,
            "image": payload?.image,
            "bankName": payload?.bankName,
            "ifscCode": payload?.ifscCode,
            "accountNumber": payload?.accountNumber,
            "bankAddress": payload?.bankAddress,
            "accountHolderName": payload?.accountHolderName,
            "finderFee": payload?.finderFee,
            "finderFeeType": payload?.accountNumber,
            "faq": payload?.faq,
            "aboutus": payload?.aboutus,
            "tandc": payload?.tandc,
            "shippingpolicy": payload?.shippingpolicy,
            "cancelpolicy": payload?.cancelpolicy,
        })
        res.status(200).json({
            success: true,
            data: data
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error!",
            error: error?.message
        });
    }
}

export const getConfigurations = async (req, res) => {
    try {
        const { bapId = "buyer-app-stage.thewitslab.com", type = "basic" } = req.query;
        if (!["basic", "bank", "finder", "faq", "aboutus", "tandc", "shippingpolicy", "cancelpolicy"].includes(type)) {
            return res.status(200).json({
                success: true,
                data: {},
            })
        }
        let response;
        let configurations = await Configuration.findOne({ bapId }).lean().exec()
        if (type == "basic") {
            response = {
                "bapId": configurations?.bapId,
                "name": configurations?.name,
                "logo": configurations?.logo,
                "color": configurations?.color,
                "image": configurations?.image,
            }
        }
        if (type == "faq") response = configurations?.faq
        if (type == "aboutus") response = configurations?.aboutus
        if (type == "tandc") response = configurations?.tandc
        if (type == "shippingpolicy") response = configurations?.shippingpolicy
        if (type == "cancelpolicy") response = configurations?.cancelpolicy
        res.status(200).json({
            success: true,
            data: { bapId: configurations?.bapId, [type]: response },
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error!",
            error: error?.message
        });
    }

}