export function getRefundAmountFromFulfillment(fulfillment) {
    let sumOfNegativeValues = 0;
    fulfillment?.tags?.forEach((tag) => {
        if (tag?.code === "quote_trail") {
            tag?.list?.forEach((item) => {
                if (item?.code === "value") {
                    let value = parseFloat(item?.value);
                    if (!isNaN(value) && value < 0) {
                        sumOfNegativeValues += value;
                    }
                }
            });
        }
    });
    console.log('sumOfNegativeValues', sumOfNegativeValues);
    return sumOfNegativeValues;
}