import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import {setBooking, getAllBooking, getBookingDetail, getAllBookingAdmin} from '../controllers/bookingController.js';

const bookingRouter = express.Router();

bookingRouter.post('/booking', autenticate, setBooking);
bookingRouter.get('/booking/:userId', autenticate, getAllBooking);
bookingRouter.get('/booking/detail/:bookingId', autenticate, getBookingDetail);
bookingRouter.get('/booking', autenticate, getAllBookingAdmin); //admin

export default bookingRouter;