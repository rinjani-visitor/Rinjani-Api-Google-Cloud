import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import { getDashboard, getDashboardUser } from '../controllers/dasboardController.js';

const dashboardRouter = express.Router();

dashboardRouter.get('/admin/dashboard', autenticate, getDashboard); //admin

dashboardRouter.get('/dashboard', getDashboardUser); 

export default dashboardRouter;