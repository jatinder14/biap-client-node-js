import OrderMongooseModel from "../../v1/db/order.js";

export const totalItemsOrderedCount = (orderId) => {

    return OrderMongooseModel.aggregate([
        {
            $match: { id: orderId },
        },
        {
            $unwind: "$items",
        },
        {
            $group: {
                _id: null,
                totalCount: { $sum: "$items.quantity.count" },
            },
        },
    ])
}


export const orderDataByIdAndTransactionId = (transactionId,id) => {
    return OrderMongooseModel.find({
        transactionId: transactionId,
        id: id,
    });
}
