import axios from "axios";

export const bhashiniTranslator = async (req, res, next) => {
  try {
    let lang;
    if (!req.query.lang || req.query.lang === "en") {
      return res.status(200).json(req.body.responseData);
    } else {
      lang = req.query.lang;
    }
    const { page } = req.query; // Extract page number from query parameter

    let responseData = req.body.responseData;
    const itemsPerPage = 8;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToTranslate = responseData.response.data
      .slice(startIndex, endIndex)
      .map((item) => ({
        itemName: item.item_details.descriptor.name.includes("ASSN.")
          ? item.item_details.descriptor.name.replace(/ASSN./g, "")
          : item.item_details.descriptor.name,
        providerName: item.provider_details.descriptor.name,
      }));

    // Extract values for translation
    let valuesToTranslate = itemsToTranslate.flatMap((item) => [
      item.itemName,
      item.providerName,
    ]);
     valuesToTranslate = valuesToTranslate.map(item => item.replace(/[’]/g, ''));
    //  valuesToTranslate=["Amul Lassi","Rocket Grocery","Cavins Kaju Butterscotch Milk Shake","Rocket Grocery","Cavins Chocolate Milk Shake","Rocket Grocery","Cavins Strawberry Milk Shake","Rocket Grocery","Hersheys Chocolate Milk Shake","Rocket Grocery","Hersheys Cookies n Creme Milk Shake","Rocket Grocery","Hersheys Strawberry Milk Shake","Rocket Grocery","Nescafe Hazelnut Cold Coffee (Ready to Drink)","Rocket Grocery","Nescafe Ready To Drink Coffee, Iced Latte Flavoured Milk","Rocket Grocery","Bingo Mad Angles Cheese Nachos","Rocket Grocery"]

    // valuesToTranslate=["Amul Lassi","Rocket Grocery","Cavins Kaju Butterscotch Milk Shake","Rocket Grocery","Cavins Chocolate Milk Shake","Rocket Grocery","Cavins Strawberry Milk Shake","Rocket Grocery","Hersheys Chocolate Milk Shake","Rocket Grocery","Hersheys Cookies n Creme Milk Shake","Rocket Grocery","Hersheys Strawberry Milk Shake","Rocket Grocery","Nescafe Hazelnut Cold Coffee (Ready to Drink)","Rocket Grocery"]
    console.log("valuesToTranslate",JSON.stringify(valuesToTranslate))
    console.log("valuesToTranslate",valuesToTranslate.length)

    let data = {
      pipelineTasks: [
        {
          taskType: "translation",
          config: {
            language: {
              sourceLanguage: "en",
              targetLanguage: lang,
            },
            serviceId: "ai4bharat/indictrans-v2-all-gpu--t4",
          },
        },
      ],
      inputData: {
        input: [
          {
            source: JSON.stringify(valuesToTranslate),
          },
        ],
      },
    };

    let config = {
      method: "post",
      url: "https://dhruva-api.bhashini.gov.in/services/inference/pipeline",
      headers: {
        Authorization:
          "5bcJyckKIeDJXW9x_C9gs7P7Rt1goop7SmPyrrdKHF5_4XrWrtMCJaVL8RO8hEJ8",
        "Content-Type": "application/json",
      },
      data: JSON.stringify(data),
    };

    return axios
      .request(config)
      .then((response) => {
        let translatedValues =
          response.data.pipelineResponse[0].output[0].target
            .split(",")
            .map((item) => item.split('"')[1]);
         console.log("translatedValues",translatedValues)
         console.log("translatedValues",translatedValues.length)

        let translatedData = responseData.response.data.map((item, index) => {
          let transIndex = index * 2;
          item.item_details.descriptor.name = translatedValues[transIndex];
          item.provider_details.descriptor.name =
            translatedValues[transIndex + 1];
          return item;
        });
        const paginatedTranslatedData = translatedData.slice(0, itemsPerPage);

        responseData.response.data = paginatedTranslatedData;
        return res.status(200).json(responseData);
      })
      .catch((error) => {
        console.error("Error:", error);
        // throw error;
      });
  } catch (error) {
    console.error("Error:", error);
    res.header("Access-Control-Allow-Origin", "*");
    return res.status(500).json({ message: "We encountered an unexpected error while translating all the products of a seller. Please try again later." });
  }
};
