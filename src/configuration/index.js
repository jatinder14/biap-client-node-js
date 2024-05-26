import { Router } from 'express';
import { createConfiguration, getConfigurations } from './configuration.controller.js';

const configurationRouter = new Router();

configurationRouter.post('/addConfiguration', createConfiguration)

configurationRouter.get('/getConfigurations/:type', getConfigurations)

export default configurationRouter;