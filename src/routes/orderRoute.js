import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import { updatePaymentAdmin } from '../controllers/paymentController.js';
import { cancelOrder, getAllOrder, getAllOrderAdmin } from '../controllers/orderController.js';

const orderRouter = express.Router();

orderRouter.get('/order/:userId', autenticate, getAllOrder);
orderRouter.get('/admin/order', autenticate, getAllOrderAdmin); //admin
orderRouter.patch('/order/:userId', autenticate, cancelOrder); 

export default orderRouter;
