import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import { setBankPayment, setWisePayment, updateBankWiseMethodPayment } from '../controllers/paymentController.js';
import upload from '../middleware/multer.js';

const paymentRouter = express.Router();

paymentRouter.patch('/payment', autenticate, updateBankWiseMethodPayment);
paymentRouter.post('/payment/bank', autenticate, upload('./public/images/payment/bank').single('imageProofTransfer'), setBankPayment);
paymentRouter.post('/payment/wise', autenticate, upload('./public/images/payment/wise').single('imageProofTransfer'), setWisePayment);

export default paymentRouter;
