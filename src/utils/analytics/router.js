import { Router } from 'express';

import analyticRoutes from "./analytic.routes.js"

const router = new Router();
router.use(analyticRoutes)

export default router;