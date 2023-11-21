import express from 'express';
import userRouter from './userRoute.js';
import { errorrHandling } from '../controllers/errorHandlingController.js';
import productRouter from './productRoute.js';
import categoryRouter from './categoryRoute.js';
import facilityRouter from './facilityRoute.js';
import reviewRouter from './reviewRoute.js';
import bookingRouter from './bookingRoute.js';
import paymentRouter from './paymentRoute.js';
import orderRouter from './orderRoute.js';

const route = express.Router();

route.use('/home', (req, res) => {
  const data = {
    title: 'Home',
    name: 'Ini adalah halaman home',
  };
  res.render('index', data);
});

route.use('/api', userRouter);
route.use('/api', productRouter);
route.use('/api', categoryRouter);
route.use('/api', facilityRouter);
route.use('/api', bookingRouter);
route.use('/api', paymentRouter);
route.use('/api', orderRouter);
route.use('/api', reviewRouter);

route.use('*', errorrHandling);
route.use('*', (req, res) => {
  res.status(404).json({
    errors: ['Page Not Found'],
    message: 'Internal Server Error',
    data: null,
  });
});

export default route;
