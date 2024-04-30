import OrderMongooseModel from "../../v1/db/order.js";

class DashboardController {
  async customerSummary(req, res, next) {
    try {
      const filter = req.query.filter ? String(req.query.filter) : "weekly";
      const data = {};
      switch (filter) {
        case "overall": {
          const customerDetails = await OrderMongooseModel.distinct("userId");
          const customerCount = customerDetails.length;
          data["overall"] = customerCount;
          break;
        }
        case "yearly": {
          const currDate = new Date();
          const prevYearStart = new Date(currDate.getFullYear() - 1, 0, 0);
          const thisYearEnd = new Date(currDate.getFullYear() + 1, 0, 0);

          const customerDetails = await OrderMongooseModel.find({
            is_order_confirmed: true,
            createdAt: { $gte: prevYearStart, $lt: thisYearEnd },
          }).select({ createdAt: 1, userId: 1 });

          const thisYearCustomers = new Set();
          const prevYearCustomers = new Set();
          customerDetails.forEach((item) => {
            if (item.createdAt >= new Date(currDate.getFullYear(), 0, 0)) {
              thisYearCustomers.add(item.userId);
            } else {
              prevYearCustomers.add(item.userId);
            }
          });
          data["currentCount"] = thisYearCustomers.size;
          data["prevCount"] = prevYearCustomers.size;
          data["change"] = percentageChange(data.prevCount, data.currentCount);
          break;
        }
        case "monthly": {
          const currDate = new Date();
          let lastMonth;
          let lastYear;
          if (currDate.getMonth() == 1) {
            lastMonth = 11; //0-indexed
            lastYear = currDate.getFullYear() - 1;
          } else {
            lastMonth = currDate.getMonth() - 1;
            lastYear = currDate.getFullYear();
          }

          const customerDetails = await OrderMongooseModel.find({
            is_order_confirmed: true,
            createdAt: {
              $gte: new Date(lastYear, lastMonth, 0),
              $lt: new Date(
                currDate.getFullYear(),
                currDate.getMonth() + 1,
                0,
                0,
                0,
                0,
                0
              ),
            },
          }).select({ createdAt: 1, userId: 1 });

          const thisMonthCustomers = new Set();
          const prevMonthCustomers = new Set();

          customerDetails.forEach((item) => {
            if (
              item.createdAt >=
              new Date(currDate.getFullYear(), currDate.getMonth(), 1)
            ) {
              thisMonthCustomers.add(item.userId);
            } else {
              prevMonthCustomers.add(item.userId);
            }
          });

          data["currentCount"] = thisMonthCustomers.size;
          data["prevCount"] = prevMonthCustomers.size;
          data["change"] = percentageChange(data.prevCount, data.currentCount);
          break;
        }
        case "weekly": {
          const currDate = new Date();
          const currDay = currDate.getDay();
          const weekStart = new Date(
            currDate.getFullYear(),
            currDate.getMonth(),
            currDate.getDate() - currDay + 1,
            0,
            0,
            0,
            0
          );
          const prevWeekStart = new Date(
            currDate.getFullYear(),
            currDate.getMonth(),
            currDate.getDate() - currDay - 6,
            0,
            0,
            0,
            0
          );
          const weekEnd = new Date(
            currDate.getFullYear(),
            currDate.getMonth(),
            currDate.getDate() - currDay + 8,
            0,
            0,
            0,
            0
          );
          const customerDetails = await OrderMongooseModel.find({
            is_order_confirmed: true,
            createdAt: {
              $gte: prevWeekStart,
              $lt: weekEnd,
            },
          }).select({ createdAt: 1, userId: 1 });

          const thisWeekCustomers = new Set();
          const prevWeekCustomers = new Set();
          customerDetails.forEach((item) => {
            if (item.createdAt >= weekStart) {
              thisWeekCustomers.add(item.userId);
            } else {
              prevWeekCustomers.add(item.userId);
            }
          });
          data["currentCount"] = thisWeekCustomers.size;
          data["prevCount"] = prevWeekCustomers.size;
          data["change"] = percentageChange(data.prevCount, data.currentCount);
          break;
        }
        default:
          throw new Error("Invalid Filter");
      }
      return res.status(200).json({
        success: true,
        message: "Data fetched successfully",
        data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async topSellingSummary(req, res, next) {
    try {
      const currDate = new Date();
      const filter = req.query.filter ? String(req.query.filter) : "weekly";
      let data = {};
      switch (filter) {
        case "overall": {
          const orderDetails = await OrderMongooseModel.find({
            is_order_confirmed: true,
          }).select({
            items: 1,
            _id: 0,
          });
          data = orderDetails;
          break;
        }
        case "yearly": {
          const orderDetails = await OrderMongooseModel.find({
            is_order_confirmed: true,
            createdAt: {
              $gte: new Date(currDate.getFullYear(), 0, 0),
              $lt: new Date(currDate.getFullYear() + 1, 0, 0),
            },
          }).select({
            items: 1,
            _id: 0,
          });
          data = orderDetails;
          break;
        }
        case "monthly": {
          const orderDetails = await OrderMongooseModel.find({
            is_order_confirmed: true,
            createdAt: {
              $gte: new Date(currDate.getFullYear(), currDate.getMonth(), 0),
              $lt: new Date(currDate.getFullYear(), currDate.getMonth() + 1, 0),
            },
          }).select({
            items: 1,
            _id: 0,
          });
          data = orderDetails;
          break;
        }
        case "weekly": {
          const currDay = currDate.getDay();
          const weekStart = new Date(
            currDate.getFullYear(),
            currDate.getMonth(),
            currDate.getDate() - currDay + 1,
            0,
            0,
            0,
            0
          );
          const weekEnd = new Date(
            currDate.getFullYear(),
            currDate.getMonth(),
            currDate.getDate() - currDay + 8,
            0,
            0,
            0,
            0
          );
          const orderDetails = await OrderMongooseModel.find({
            is_order_confirmed: true,
            createdAt: { $gte: weekStart, $lt: weekEnd },
          }).select({
            items: 1,
            _id: 0,
          });
          data = orderDetails;
          break;
        }
        default:
          throw new Error("Invalid Filter");
      }

      //Top 5 mapping
      const products = {};
      data.forEach((order) => {
        const items = order.items || [];

        items?.forEach((item) => {
          const itemId = item.id;
          const itemCount = item.quantity.count;
          const itemName = item.product.descriptor.name;

          if (itemId in products) {
            const count = products[itemId][0];
            products[itemId] = [count + itemCount, itemName];
          } else {
            products[itemId] = [itemCount, itemName];
          }
        });
      });

      const productSalesArray = Object.entries(products);
      productSalesArray.sort((a, b) => b[1][0] - a[1][0]);

      const top5Selling = productSalesArray.slice(0, 5);

      //Data Mapping
      const top5 = [];
      top5Selling.forEach((item) => {
        const itemObject = {};
        itemObject["id"] = item[0];
        itemObject["title"] = item[1][1];
        itemObject["count"] = item[1][0];

        top5.push(itemObject);
      });

      return res.status(200).json({
        success: true,
        message: "Data fetched successfully",
        data: top5,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async orderSummary(req, res, next) {
    try {
      const currentYear = new Date().getFullYear();
      const filter = req.query.filter ? String(req.query.filter) : "weekly";

      // if(filter === "total"){
      //   const totalCount = await OrderMongooseModel.count()
      //   return res.status(200).json({
      //     success: true,
      //     message: "Data fetched successfully",
      //     totalCount,
      //   });
      // }

      const fetchData = await OrderMongooseModel.aggregate([
        {
          $match: {
            is_order_confirmed: true,
          },
        },
        {
          $project: {
            order_year: { $year: "$createdAt" },
            order_month: {
              $dateToString: { format: "%b", date: "$createdAt" },
            },
            order_week: { $isoWeek: "$createdAt" },
            state: 1,
          },
        },
        {
          $group: {
            _id: {
              order_year: "$order_year",
              order_month: "$order_month",
              order_week: "$order_week",
            },
            accepted_count: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      {
                        $regexMatch: { input: "$state", regex: /^accepted$/i },
                      },
                      { $regexMatch: { input: "$state", regex: /^packed$/i } },
                      { $regexMatch: { input: "$state", regex: /^created$/i } },
                      { $eq: ["$state", null] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            inprogress_count: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      {
                        $regexMatch: {
                          input: "$state",
                          regex: /^inprogress$/i,
                        },
                      },
                      {
                        $regexMatch: {
                          input: "$state",
                          regex: /^in-progress$/i,
                        },
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            completed_count: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      {
                        $regexMatch: { input: "$state", regex: /^completed$/i },
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            cancelled_count: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      {
                        $regexMatch: { input: "$state", regex: /^cancelled$/i },
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $sort: {
            "_id.order_year": 1,
            "_id.order_month": 1,
            "_id.order_week": 1,
          },
        },
      ]);

      let data = {};
      switch (filter) {
        case "yearly": {
          fetchData.forEach((dataEntry) => {
            const year = dataEntry["_id"].order_year;
            if (data?.[year]) {
              data[year].accepted_count += dataEntry.accepted_count;
              data[year].inprogress_count += dataEntry.inprogress_count;
              data[year].completed_count += dataEntry.completed_count;
              data[year].cancelled_count += dataEntry.cancelled_count;
            } else {
              data[year] = {};
              data[year]["accepted_count"] = dataEntry.accepted_count;
              data[year]["inprogress_count"] = dataEntry.inprogress_count;
              data[year]["completed_count"] = dataEntry.completed_count;
              data[year]["cancelled_count"] = dataEntry.cancelled_count;
            }
          });
          break;
        }
        case "monthly": {
          fetchData.forEach((dataEntry) => {
            const year = dataEntry["_id"].order_year;
            const month = dataEntry["_id"].order_month;
            if (year == currentYear) {
              if (data?.[month]) {
                data[month].accepted_count += dataEntry.accepted_count;
                data[month].inprogress_count += dataEntry.inprogress_count;
                data[month].completed_count += dataEntry.completed_count;
                data[month].cancelled_count += dataEntry.cancelled_count;
              } else {
                data[month] = {};
                data[month]["accepted_count"] = dataEntry.accepted_count;
                data[month]["inprogress_count"] = dataEntry.inprogress_count;
                data[month]["completed_count"] = dataEntry.completed_count;
                data[month]["cancelled_count"] = dataEntry.cancelled_count;
              }
            }
          });
          break;
        }
        case "weekly": {
          fetchData.forEach((dataEntry) => {
            const year = dataEntry["_id"].order_year;
            const week = dataEntry["_id"].order_week;
            if (year == currentYear) {
              if (data?.[week]) {
                data[week].accepted_count += dataEntry.accepted_count;
                data[week].inprogress_count += dataEntry.inprogress_count;
                data[week].completed_count += dataEntry.completed_count;
                data[week].cancelled_count += dataEntry.cancelled_count;
              } else {
                data[week] = {};
                data[week]["accepted_count"] = dataEntry.accepted_count;
                data[week]["inprogress_count"] = dataEntry.inprogress_count;
                data[week]["completed_count"] = dataEntry.completed_count;
                data[week]["cancelled_count"] = dataEntry.cancelled_count;
              }
            }
          });

          //Extra days in previous year but Week 1
          fetchData.find((item) => {
            if (
              item["_id"].order_year == currentYear - 1 &&
              item["_id"].order_month == "Dec" &&
              item["_id"].order_week == "01"
            ) {
              if (data?.["01"]) {
                data["01"].accepted_count += item.accepted_count;
                data["01"].inprogress_count += item.inprogress_count;
                data["01"].completed_count += item.completed_count;
                data["01"].cancelled_count += item.cancelled_count;
              } else {
                data["01"] = {};
                data["01"].accepted_count = item.accepted_count;
                data["01"].inprogress_count = item.inprogress_count;
                data["01"].completed_count = item.completed_count;
                data["01"].cancelled_count = item.cancelled_count;
              }
              return true;
            }
          });
          break;
        }
        default:
          throw new Error("Invalid Filter");
      }

      return res.status(200).json({
        success: true,
        message: "Data fetched successfully",
        data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async totalOrderSummary(req, res, next) {
    try {
      const filter = req.query.filter ? String(req.query.filter) : "weekly";
      const data = {};

      switch (filter) {
        case "overall": {
          const orderCount = await OrderMongooseModel.count({
            is_order_confirmed: true,
          });
          data["overall"] = orderCount;
          break;
        }
        case "yearly": {
          const currDate = new Date();
          const prevYearStart = new Date(currDate.getFullYear() - 1, 0, 0);
          const thisYearEnd = new Date(currDate.getFullYear() + 1, 0, 0);

          const orderDetails = await OrderMongooseModel.find({
            is_order_confirmed: true,
            createdAt: { $gte: prevYearStart, $lt: thisYearEnd },
          }).select({ createdAt: 1 });

          let prevCount = 0;
          let currCount = 0;
          orderDetails.forEach((item) => {
            if (item.createdAt >= new Date(currDate.getFullYear(), 0, 0)) {
              currCount += 1;
            } else {
              prevCount += 1;
            }
          });
          data["currentCount"] = currCount;
          data["prevCount"] = prevCount;
          data["change"] = percentageChange(data.prevCount, data.currentCount);
          break;
        }
        case "monthly": {
          const currDate = new Date();
          let lastMonth;
          let lastYear;
          if (currDate.getMonth() == 1) {
            lastMonth = 11; //0-indexed
            lastYear = currDate.getFullYear() - 1;
          } else {
            lastMonth = currDate.getMonth() - 1;
            lastYear = currDate.getFullYear();
          }

          const orderDetails = await OrderMongooseModel.find({
            is_order_confirmed: true,
            createdAt: {
              $gte: new Date(lastYear, lastMonth, 0),
              $lt: new Date(
                currDate.getFullYear(),
                currDate.getMonth() + 1,
                0,
                0,
                0,
                0,
                0
              ),
            },
          }).select({ createdAt: 1 });

          let prevCount = 0;
          let currCount = 0;

          orderDetails.forEach((item) => {
            if (
              item.createdAt >=
              new Date(currDate.getFullYear(), currDate.getMonth(), 1)
            ) {
              currCount += 1;
            } else {
              prevCount += 1;
            }
          });

          data["currentCount"] = currCount;
          data["prevCount"] = prevCount;
          data["change"] = percentageChange(data.prevCount, data.currentCount);
          break;
        }
        case "weekly": {
          const currDate = new Date();
          const currDay = currDate.getDay();
          const weekStart = new Date(
            currDate.getFullYear(),
            currDate.getMonth(),
            currDate.getDate() - currDay + 1,
            0,
            0,
            0,
            0
          );
          const prevWeekStart = new Date(
            currDate.getFullYear(),
            currDate.getMonth(),
            currDate.getDate() - currDay - 6,
            0,
            0,
            0,
            0
          );
          const weekEnd = new Date(
            currDate.getFullYear(),
            currDate.getMonth(),
            currDate.getDate() - currDay + 8,
            0,
            0,
            0,
            0
          );
          const orderDetails = await OrderMongooseModel.find({
            is_order_confirmed: true,
            createdAt: {
              $gte: prevWeekStart,
              $lt: weekEnd,
            },
          }).select({ createdAt: 1 });

          let prevCount = 0;
          let currCount = 0;
          orderDetails.forEach((item) => {
            if (item.createdAt >= weekStart) {
              currCount += 1;
            } else {
              prevCount += 1;
            }
          });
          data["currentCount"] = currCount;
          data["prevCount"] = prevCount;
          data["change"] = percentageChange(data.prevCount, data.currentCount);
          break;
        }
        default:
          throw new Error("Invalid Filter");
      }
      return res.status(200).json({
        success: true,
        message: "Data fetched successfully",
        data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async earningSummary(req, res, next) {
    try {
      const filter = req.query.filter ? String(req.query.filter) : "weekly";

      const currDate = new Date();
      let data = {};
      switch (filter) {
        case "overall": {
          const earningDetails = await OrderMongooseModel.find({
            is_order_confirmed: true,
          }).select({
            state: 1,
            "quote.price.value": 1,
            _id: 0,
          });
          data = { all: 0, pending: 0, received: 0 };
          earningDetails.forEach((item) => {
            data.all += parseFloat(item.quote.price.value);
            if (
              item.state.toLowerCase() === "created" ||
              item.state.toLowerCase() === "accepted" ||
              item.state.toLowerCase() === "inprogress" ||
              item.state.toLowerCase() === "in-progress"
            ) {
              data.pending += parseFloat(item.quote.price.value);
            }
            if (item.state.toLowerCase() === "completed") {
              data.received += parseFloat(item.quote.price.value);
            }
          });
          break;
        }
        case "yearly": {
          const prevYearStart = new Date(currDate.getFullYear() - 1, 0, 0);
          const thisYearEnd = new Date(currDate.getFullYear() + 1, 0, 0);
          const earningDetails = await OrderMongooseModel.find({
            is_order_confirmed: true,
            createdAt: {
              $gte: prevYearStart,
              $lt: thisYearEnd,
            },
          }).select({
            state: 1,
            "quote.price.value": 1,
            createdAt: 1,
            _id: 0,
          });

          data = {
            all: { currentCount: 0, prevCount: 0 },
            pending: { currentCount: 0, prevCount: 0 },
            received: { currentCount: 0, prevCount: 0 },
          };

          earningDetails.forEach((item) => {
            if (item.createdAt >= new Date(currDate.getFullYear(), 0, 1)) {
              data.all.currentCount += parseFloat(item.quote.price.value);
              if (
                item.state.toLowerCase() === "created" ||
                item.state.toLowerCase() === "accepted" ||
                item.state.toLowerCase() === "inprogress" ||
                item.state.toLowerCase() === "in-progress"
              ) {
                data.pending.currentCount += parseFloat(item.quote.price.value);
              }
              if (item.state.toLowerCase() === "completed") {
                data.received.currentCount += parseFloat(
                  item.quote.price.value
                );
              }
            } else {
              data.all.prevCount += parseFloat(item.quote.price.value);
              if (
                item.state.toLowerCase() === "created" ||
                item.state.toLowerCase() === "accepted" ||
                item.state.toLowerCase() === "inprogress" ||
                item.state.toLowerCase() === "in-progress"
              ) {
                data.pending.prevCount += parseFloat(item.quote.price.value);
              }
              if (item.state.toLowerCase() === "completed") {
                data.received.prevCount += parseFloat(item.quote.price.value);
              }
            }
          });

          data.all["change"] = percentageChange(
            data.all.prevCount,
            data.all.currentCount
          );
          data.pending["change"] = percentageChange(
            data.pending.prevCount,
            data.pending.currentCount
          );
          data.received["change"] = percentageChange(
            data.received.prevCount,
            data.received.currentCount
          );
          break;
        }
        case "monthly": {
          let lastMonth;
          let lastYear;
          if (currDate.getMonth() == 1) {
            lastMonth = 11; //0-indexed
            lastYear = currDate.getFullYear() - 1;
          } else {
            lastMonth = currDate.getMonth() - 1;
            lastYear = currDate.getFullYear();
          }
          const earningDetails = await OrderMongooseModel.find({
            is_order_confirmed: true,
            createdAt: {
              $gte: new Date(lastYear, lastMonth, 0),
              $lt: new Date(
                currDate.getFullYear(),
                currDate.getMonth() + 1,
                0,
                0,
                0,
                0,
                0
              ),
            },
          }).select({
            state: 1,
            "quote.price.value": 1,
            createdAt: 1,
            _id: 0,
          });

          data = {
            all: { currentCount: 0, prevCount: 0 },
            pending: { currentCount: 0, prevCount: 0 },
            received: { currentCount: 0, prevCount: 0 },
          };

          earningDetails.forEach((item) => {
            if (
              item.createdAt >=
              new Date(currDate.getFullYear(), currDate.getMonth(), 0)
            ) {
              data.all.currentCount += parseFloat(item.quote.price.value);
              if (
                item.state.toLowerCase() === "created" ||
                item.state.toLowerCase() === "accepted" ||
                item.state.toLowerCase() === "inprogress" ||
                item.state.toLowerCase() === "in-progress"
              ) {
                data.pending.currentCount += parseFloat(item.quote.price.value);
              }

              if (item.state.toLowerCase() === "completed") {
                data.received.currentCount += parseFloat(
                  item.quote.price.value
                );
              }
            } else {
              data.all.prevCount += parseFloat(item.quote.price.value);

              if (
                item.state.toLowerCase() === "created" ||
                item.state.toLowerCase() === "accepted" ||
                item.state.toLowerCase() === "inprogress" ||
                item.state.toLowerCase() === "in-progress"
              ) {
                data.pending.prevCount += parseFloat(item.quote.price.value);
              }

              if (item.state.toLowerCase() === "completed") {
                data.received.prevCount += parseFloat(item.quote.price.value);
              }
            }
          });

          data.all["change"] = percentageChange(
            data.all.prevCount,
            data.all.currentCount
          );
          data.pending["change"] = percentageChange(
            data.pending.prevCount,
            data.pending.currentCount
          );
          data.received["change"] = percentageChange(
            data.received.prevCount,
            data.received.currentCount
          );

          break;
        }
        case "weekly": {
          const currDay = currDate.getDay();
          const weekStart = new Date(
            currDate.getFullYear(),
            currDate.getMonth(),
            currDate.getDate() - currDay + 1,
            0,
            0,
            0,
            0
          );
          const prevWeekStart = new Date(
            currDate.getFullYear(),
            currDate.getMonth(),
            currDate.getDate() - currDay - 6,
            0,
            0,
            0,
            0
          );
          const weekEnd = new Date(
            currDate.getFullYear(),
            currDate.getMonth(),
            currDate.getDate() - currDay + 8,
            0,
            0,
            0,
            0
          );
          data = {
            all: { currentCount: 0, prevCount: 0 },
            pending: { currentCount: 0, prevCount: 0 },
            received: { currentCount: 0, prevCount: 0 },
          };
          const earningDetails = await OrderMongooseModel.find({
            is_order_confirmed: true,
            createdAt: {
              $gte: prevWeekStart,
              $lt: weekEnd,
            },
          }).select({
            state: 1,
            "quote.price.value": 1,
            createdAt: 1,
            _id: 0,
          });

          earningDetails.forEach((item) => {
            if (item.createdAt >= weekStart) {
              data.all.currentCount += parseFloat(item.quote.price.value);
              if (
                item.state.toLowerCase() === "created" ||
                item.state.toLowerCase() === "accepted" ||
                item.state.toLowerCase() === "inprogress" ||
                item.state.toLowerCase() === "in-progress"
              ) {
                data.pending.currentCount += parseFloat(item.quote.price.value);
              }

              if (item.state.toLowerCase() === "completed") {
                data.received.currentCount += parseFloat(
                  item.quote.price.value
                );
              }
            } else {
              data.all.prevCount += parseFloat(item.quote.price.value);

              if (
                item.state.toLowerCase() === "created" ||
                item.state.toLowerCase() === "accepted" ||
                item.state.toLowerCase() === "inprogress" ||
                item.state.toLowerCase() === "in-progress"
              ) {
                data.pending.prevCount += parseFloat(item.quote.price.value);
              }

              if (item.state.toLowerCase() === "completed") {
                data.received.prevCount += parseFloat(item.quote.price.value);
              }
            }
          });

          data.all["change"] = percentageChange(
            data.all.prevCount,
            data.all.currentCount
          );
          data.pending["change"] = percentageChange(
            data.pending.prevCount,
            data.pending.currentCount
          );
          data.received["change"] = percentageChange(
            data.received.prevCount,
            data.received.currentCount
          );

          break;
        }
        default:
          throw new Error("Invalid Filter");
      }
      return res.status(200).json({
        success: true,
        message: "Data fetched successfully",
        data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

const percentageChange = (prevCount, currentCount) => {
  if (prevCount == 0 && currentCount != 0) {
    return 100;
  } else if (prevCount == 0 && currentCount == 0) {
    return 0;
  } else {
    return ((currentCount - prevCount) / prevCount) * 100;
  }
};

export default DashboardController;
