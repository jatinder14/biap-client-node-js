import { Router } from 'express';
import { rspController } from "../rsp_controller/index.js"
export const rootRouter = new Router();

rootRouter.post('/response/v2/on_collector_recon', rspController.onCollectorRecon);
rootRouter.post('/response/v2/on_prepare_recon', rspController.onPrepareRecon);
rootRouter.post("/response/v2/receiver_recon", rspController.receiverRecon)

export default rootRouter;
