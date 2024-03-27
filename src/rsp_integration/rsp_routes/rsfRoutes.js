import {Router} from 'express';
import { authentication } from '../../middlewares/index.js';

import {onCollectorReconController} from "../rsp_controller/index.js"
export const rootRouter = new Router();

// const recieivereconController= new RecieiverReconController()


    //#region confirm order

// confirm order v1
rootRouter.post(
    '/v2/on_collector_recon',onCollectorReconController.onCollectorRecon,
);


//#endregion

export default rootRouter;
