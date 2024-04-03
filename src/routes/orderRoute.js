import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import { cancelOrder, getAllOrder, getAllOrderAdmin } from '../controllers/orderController.js';

const orderRouter = express.Router();

orderRouter.get('/order/', autenticate, getAllOrder);
orderRouter.get('/admin/order', autenticate, getAllOrderAdmin); //admin
orderRouter.patch('/order/:orderId', autenticate, cancelOrder); 

export default orderRouter;
