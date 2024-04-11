import {Router} from 'express';

import DashboardController from '../../order/v2/dashboard/dashboard.controller.js';

const rootRouter = new Router();

const dashboardController = new DashboardController(); 

rootRouter.get('/customer-analysis', dashboardController.customerSummary)

rootRouter.get('/topSelling-analysis', dashboardController.topSellingSummary)

rootRouter.get('/order-analysis', dashboardController.orderSummary)

rootRouter.get('/earning-analysis', dashboardController.earningSummary)

export default rootRouter