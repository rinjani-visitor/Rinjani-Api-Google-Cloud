import express from 'express';
import 'dotenv/config';
import { autenticate } from '../controllers/errorHandlingController.js';
import {
  setBooking,
  getAllBooking,
  getBookingDetail,
  getAllBookingAdmin,
  updateBookingAdmin,
  updateBooking,
  deleteBooking,
} from '../controllers/bookingController.js';

const bookingRouter = express.Router();

bookingRouter.post('/booking', autenticate, setBooking);
bookingRouter.get('/booking', autenticate, getAllBooking);
bookingRouter.delete('/booking/:bookingId', autenticate, deleteBooking);
bookingRouter.get('/booking/:bookingId', autenticate, getBookingDetail); 
bookingRouter.get('/admin/booking/:bookingId', autenticate, getBookingDetail); //admin
bookingRouter.patch('/booking/:bookingId', autenticate, updateBooking);
bookingRouter.get('/admin/booking', autenticate, getAllBookingAdmin); //admin
bookingRouter.patch(
  '/admin/booking/:bookingId',
  autenticate,
  updateBookingAdmin
); //admin

export default bookingRouter;
