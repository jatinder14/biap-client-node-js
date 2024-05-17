import Configuration from "./db/configuration.js"

export const add = async (req, res, next) => {
    try {
        let payload = req?.body;
        let data = await Configuration.create({
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
        })
        res.status(200).json({
            success: true,
            data: data
        })

    } catch (error) {
        res.status(500).json({ "success": false, "message": "Internal Server Error!", error: error?.message });
    }
}

export const getConfigurations = async (req, res) => {
    try {
        const { page = 1, limit = 100 } = req.query; // Default page: 1, limit: 10 configurations per page
        const pageNumber = parseInt(page); // Parse the page number as an integer
        const limitNumber = parseInt(limit); // Parse the limit as an integer
        // console.log('configuration fetched:', req.query);

        let configurations = await Configuration.find().skip((pageNumber - 1) * limitNumber) // Skip records based on page number
            .limit(limitNumber)

        res.status(200).json({
            success: true,
            data: configurations,
        })
    } catch (error) {
        res.status(500).json({ "success": false, "message": "Internal Server Error", error: error?.message });
    }

}