import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import { updatePaymentAdmin } from '../controllers/paymentController.js';

const orderRouter = express.Router();

orderRouter.post('/admin/order/:paymentId', autenticate, updatePaymentAdmin); //admin

export default orderRouter;
