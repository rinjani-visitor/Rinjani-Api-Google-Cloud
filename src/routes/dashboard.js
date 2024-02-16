import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import { getDashboard } from '../controllers/dasboardController.js';

const dashboardRouter = express.Router();

dashboardRouter.get('/admin/dashboard', autenticate, getDashboard); //admin

export default dashboardRouter;