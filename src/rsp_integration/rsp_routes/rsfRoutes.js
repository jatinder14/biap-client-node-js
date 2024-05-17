import {Router} from 'express';
import { authentication } from '../../middlewares/index.js';

import {onCollectorReconController} from "../rsp_controller/index.js"
export const rootRouter = new Router();

rootRouter.post('/response/v2/on_collector_recon',onCollectorReconController.onCollectorRecon);
rootRouter.post('/response/v2/on_prepare_recon',onCollectorReconController.onPrepareRecon);


//#endregion

export default rootRouter;
