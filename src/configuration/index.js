import { Router } from 'express';
import { add, getConfigurations } from './configuration.controller.js';

const configurationRouter = new Router();

configurationRouter.post('/add-configuration', add)

configurationRouter.post('/get-configurations', getConfigurations)

export default configurationRouter;