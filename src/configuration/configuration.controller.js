import Configuration from "./db/configuration.js"

export const createConfiguration = async (req, res, next) => {
    try {
        let payload = req?.body;
        let bapId = payload?.bapId;
        if (!bapId) {
            return res.status(400).json({
                success: false,
                message: `Subscriber id is required!`,
            })
        }
        if (payload?.accountNumber) {
            if (!payload?.bankName || !payload?.ifscCode || !payload?.bankAddress || !payload?.accountHolderName) {
                return res.status(400).json({
                    success: false,
                    message: `Bank details should be valid!`,
                })
            }
        }
        if (payload?.finderFee && !payload?.finderFeeType) {
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

        if(payload?.aboutus && payload.aboutus === ""){
            return res.status(400).json({
                success: false,
                message: `About us should not be empty!`,
            })
        }
        if(payload?.tandc && payload.tandc === ""){
            return res.status(400).json({
                success: false,
                message: `Terms & Conditions should not be empty!`,
            })
        }
        if(payload?.shippingpolicy && payload.shippingpolicy === ""){
            return res.status(400).json({
                success: false,
                message: `Shipping Policy should not be empty!`,
            })
        }
        if(payload?.cancelpolicy && payload.cancelpolicy === ""){
            return res.status(400).json({
                success: false,
                message: `Cancellation Policy should not be empty!`,
            })
        }
        if(payload?.returnpolicy && payload.returnpolicy === ""){
            return res.status(400).json({
                success: false,
                message: `Return Policy should not be empty!`,
            })
        }

        let existingConfig = await Configuration.findOne({ bapId });
        let updateObject = {
            "bapId": bapId,
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
            "finderFeeType": payload?.finderFeeType,
            "faq": payload?.faq,
            "aboutus": payload?.aboutus,
            "tandc": payload?.tandc,
            "shippingpolicy": payload?.shippingpolicy,
            "cancelpolicy": payload?.cancelpolicy,
            "returnpolicy": payload?.returnpolicy,
        };
        Object.keys(updateObject).forEach(key => updateObject[key] === undefined && delete updateObject[key]);
        if (existingConfig) {
            existingConfig.set(updateObject);
            await existingConfig.save();
        } else {
            await Configuration.create(updateObject);
        }

        res.status(200).json({
            success: true,
            message: existingConfig ? "Configuration updated successfully!" : "Configuration created successfully!",
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "We encountered an unexpected error while creating the configuration, Please try again later.",
            error: error?.message
        });
    }
}

export const getConfigurations = async (req, res) => {
    try {
        const { type = "basic" } = req.params;
        const { bapId = process.env.BAP_ID } = req.query;
        if (!["basic", "bank", "finder", "faq", "aboutus", "tandc", "shippingpolicy", "cancelpolicy", "returnpolicy"].includes(type)) {
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
        if (type == "returnpolicy") response = configurations?.returnpolicy
        res.status(200).json({
            success: true,
            data: { bapId: configurations?.bapId, [type]: response },
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "We encountered an unexpected error while retrieving the configuration, Please try again later.",
            error: error?.message
        });
    }

}