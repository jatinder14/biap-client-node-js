import { Router } from 'express';
import { createConfiguration, getConfigurations } from './configuration.controller.js';

const configurationRouter = new Router();

configurationRouter.post('/addConfiguration', createConfiguration)

configurationRouter.post('/getConfigurations/:type', getConfigurations)

export default configurationRouter;