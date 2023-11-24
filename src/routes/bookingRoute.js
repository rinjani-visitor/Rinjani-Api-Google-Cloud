import express from 'express';
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
bookingRouter.get('/booking/:bookingId', autenticate, getBookingDetail); //admin and user
bookingRouter.patch('/booking/:bookingId', autenticate, updateBooking);
bookingRouter.get('/admin/booking', autenticate, getAllBookingAdmin); //admin
bookingRouter.patch(
  '/admin/booking/:bookingId',
  autenticate,
  updateBookingAdmin
); //admin

export default bookingRouter;
