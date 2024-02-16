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
import addOnsRouter from './addOnsRoute.js';
import dashboardRouter from './dashboard.js';

const route = express.Router();

route.use('/api', userRouter);
route.use('/api', productRouter);
route.use('/api', categoryRouter);
route.use('/api', facilityRouter);
route.use('/api', addOnsRouter);
route.use('/api', bookingRouter);
route.use('/api', paymentRouter);
route.use('/api', orderRouter);
route.use('/api', reviewRouter);
route.use('/api', dashboardRouter);

route.use('*', errorrHandling);
route.use("*", (req, res) => {
  res.status(403).json({
    errors: ["Page Not Found"],
    message: "Forbidden",
    data: null,
  });
});
// route.use('*', (req, res) => {
//   res.send('Hello World!')
// });

export default route;
