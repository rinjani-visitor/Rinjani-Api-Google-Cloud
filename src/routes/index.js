import express from 'express';
import { fileURLToPath } from 'url'; // Import the fileURLToPath function
import path from 'path'; // Import the path module
import userRouter from './userRoute.js';
import { errorrHandling } from '../controllers/errorHandlingController.js';
import productRouter from './productRoute.js';
import categoryRouter from './categoryRoute.js';
import facilityRouter from './facilityRoute.js';
import reviewRouter from './reviewRoute.js';
import bookingRouter from './bookingRoute.js';
import paymentRouter from './paymentRoute.js';
import orderRouter from './orderRoute.js';

// Convert import.meta.url to the file path and then get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const route = express.Router();

route.use('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/html/index.html'));
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
