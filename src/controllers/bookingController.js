import sequelize from '../utils/db.js';
import { dataValid } from '../validation/dataValidation.js';
import Booking from '../models/bookingModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import { Op } from 'sequelize';
import { isExists } from '../validation/sanitization.js';
import Payment from '../models/paymentModel.js';
import 'dotenv/config';

const note = {
  offering:
    'Your offer has been sent to the admin, please wait untill admin approve your offer',
  waiting:
    'Your offer has been approved by admin and please complete your payment to complete this booking.',
  declined:
    'Your offer has been declined by admin, you can make another offer to admin or make another booking.',
  paymentsend:
    'Your payment has been sent to the admin. We will inform you once the transaction has been accepted by admin.',
  paymentfailed:
    'Sorry, your payment failed to process. Please double-check your payment information or contact our customer service for further assistance.',
  success:
    'Your payment has been recieved and we will send you the trip detail through email. Thank you.',
};

const status = [
  'Offering',
  'Waiting for Payment',
  'Declined',
  'Payment Reviewing',
  'Payment Failed',
  'Success',
];

const getNote = async (booking_id) => {
  try {
    const booking = await Booking.findByPk(booking_id);

    if (!booking) {
      return 'Booking not found';
    }

    const statusBook = booking.bookingStatus;

    const statusToNote = {
      [status[0]]: note.offering,
      [status[1]]: note.waiting,
      [status[2]]: note.declined,
      [status[3]]: note.paymentsend,
      [status[4]]: note.paymentfailed,
      [status[5]]: note.success,
    };

    return statusToNote[statusBook] || 'Status not found';
  } catch (error) {
    throw error;
  }
};

const setBooking = async (req, res, next) => {
  const t = await sequelize.transaction();
  const valid = {
    userId: 'required',
    productId: 'required',
    startDateTime: 'required',
    offeringPrice: 'required, isDecimal',
    totalPersons: 'required, isDecimal',
  };
  try {
    const check = await Booking.findOne({
      where: {
        userId: req.body.userId,
        productId: req.body.productId,
      },
    });

    if (check) {
      await t.rollback();
      return res.status(400).json({
        errors: ['Already booked'],
        message: 'Booking Failed',
        data: null,
      });
    }

    const booking = await dataValid(valid, req.body);

    if (booking.message.length > 0) {
      return res.status(400).json({
        errors: booking.message,
        message: 'Booking Failed',
        data: null,
      });
    }

    const newBooking = await Booking.create(
      {
        ...booking.data,
      },
      {
        transaction: t,
      }
    );

    if (!newBooking) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Failed to save booking to database'],
        message: 'Booking Failed',
        data: null,
      });
    }

    await t.commit();

    const formatBooking = {
      productId: newBooking.productId,
      userId: newBooking.userId,
      bookingId: newBooking.bookingId,
      startDateTime: newBooking.startDateTime,
      endDateTime: newBooking.endDateTime,
      offeringPrice: newBooking.offeringPrice,
      addOns: newBooking.addOns,
      totalPersons: newBooking.totalPersons,
      createdAt: newBooking.createdAt,
      updatedAt: newBooking.updatedAt,
      bookingStatus: newBooking.bookingStatus,
      note: note.offering,
    };

    return res.status(200).json({
      errors: [],
      message: 'Booking successfully',
      data: formatBooking,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/bookingController.js:setBooking - ' + error.message
      )
    );
  }
};

const getAllBooking = async (req, res, next) => {
  try {
    const user_id = req.params.userId;

    const result = await Booking.findAll({
      attributes: ['bookingId', 'bookingStatus', 'createdAt'],
      where: {
        userId: user_id,
      },
      include: [
        {
          model: Product,
          attributes: ['title', 'rating', 'location'],
        },
      ],
    });

    if (!result) {
      return res.status(404).json({
        errors: ['No booking found'],
        message: 'Get All Booking Failed',
        data: null,
      });
    }

    const noteBooking = await getNote(result[0].bookingId);

    const formattedBooking = result.map((booking) => ({
      bookingId: booking.bookingId,
      bookingDate: booking.createdAt,
      bookingStatus: booking.bookingStatus,
      bookingNote: noteBooking,
      title: booking.Product ? booking.Product.title : null,
      rating: booking.Product ? booking.Product.rating : null,
      location: booking.Product ? booking.Product.location : null,
    }));

    return res.status(200).json({
      errors: [],
      message: 'Get All Booking Successfully',
      data: formattedBooking,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/bookingController.js:getAllBooking - ' + error.message
      )
    );
  }
};

const getAllBookingAdmin = async (req, res, next) => {
  try {
    let statusName = req.query.status;

    let result;

    if (statusName) {
      if (statusName == 'waiting-for-payment') {
        statusName = status[1];
      } else if (statusName == 'payment-reviewing') {
        statusName = status[3];
      }

      result = await Booking.findAll({
        attributes: ['bookingId', 'bookingStatus', 'createdAt'],
        where: {
          bookingStatus: {
            [Op.like]: `%${statusName}%`,
          },
        },
        include: [
          {
            model: Product,
            attributes: ['title', 'rating', 'location'],
          },
          {
            model: User,
            attributes: ['name', 'country'],
          },
        ],
      });
    } else {
      result = await Booking.findAll({
        attributes: ['bookingId', 'bookingStatus', 'createdAt'],
        include: [
          {
            model: Product,
            attributes: ['title', 'rating', 'location'],
          },
          {
            model: User,
            attributes: ['name', 'country'],
          },
        ],
      });
    }

    if (!result) {
      return res.status(404).json({
        errors: ['No booking found'],
        message: 'Get All Booking Admin Failed',
        data: null,
      });
    }

    const formattedBooking = result.map((booking) => ({
      bookingId: booking.bookingId,
      bookingDate: booking.createdAt,
      bookingStatus: booking.bookingStatus,
      title: booking.Product ? booking.Product.title : null,
      rating: booking.Product ? booking.Product.rating : null,
      location: booking.Product ? booking.Product.location : null,
      customerName: booking.User ? booking.User.name : null,
      customerCountry: booking.User ? booking.User.country : null,
    }));

    return res.status(200).json({
      errors: [],
      message: 'Get All Booking Admin successfully',
      data: formattedBooking,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/bookingController.js:getAllBookingAdmin - ' + error.message
      )
    );
  }
};

const getBookingDetail = async (req, res, next) => {
  try {
    const idBooking = req.params.bookingId;

    const result = await Booking.findByPk(idBooking);

    if (!result) {
      return res.status(404).json({
        errors: ['No booking found'],
        message: 'Get Booking Detail Admin Failed',
        data: null,
      });
    }

    const bookingNote = await getNote(idBooking);

    const formatBooking = {
      productId: result.productId,
      userId: result.userId,
      bookingId: result.bookingId,
      startDateTime: result.startDateTime,
      endDateTime: result.endDateTime,
      offeringPrice: result.offeringPrice,
      addOns: result.addOns,
      totalPersons: result.totalPersons,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      bookingStatus: result.bookingStatus,
      adminMessage:
        result.adminMessage !== null ? result.adminMessage : undefined,
      note: bookingNote,
    };

    return res.status(200).json({
      errors: [],
      message: 'Get Booking Detail Admin successfully',
      data: formatBooking,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/bookingController.js:getBookingDetailAdmin - ' +
          error.message
      )
    );
  }
};

const updateBookingAdmin = async (req, res, next) => {
  try {
    const idBooking = req.params.bookingId;

    const check = await Booking.findByPk(idBooking);

    if (!check) {
      return res.status(404).json({
        errors: ['No booking found'],
        message: 'Update Booking Admin Failed',
        data: null,
      });
    }

    const valid = {};

    if (isExists(req.body.bookingStatus)) {
      valid.bookingStatus = 'required';
    }

    if (isExists(req.body.adminMessage)) {
      valid.adminMessage = 'required';
    }

    const booking = await dataValid(valid, req.body);

    if (booking.message.length > 0) {
      return res.status(400).json({
        errors: booking.message,
        message: 'Update Booking Admin Failed',
        data: null,
      });
    }

    const result = await Booking.update(
      {
        ...booking.data,
      },
      {
        where: {
          bookingId: idBooking,
        },
      }
    );

    if (result[0] == 0) {
      return res.status(404).json({
        errors: ['Booking not found'],
        message: 'Update Booking Admin Failed',
        data: null,
      });
    }

    const checkBookingStatus = await Booking.findOne({
      attributes: ['bookingStatus', 'offeringPrice'],
      where: {
        bookingId: idBooking,
      },
    });

    if (checkBookingStatus.bookingStatus == 'Waiting for Payment') {
      const checkBookinginPayment = await Payment.findOne({
        where: {
          bookingId: idBooking,
        },
      });

      if (checkBookinginPayment) {
        return res.status(404).json({
          errors: ['Payment already created'],
          message: 'Update Booking Admin Failed',
          data: null,
        });
      }

      const payment = await Payment.create({
        bookingId: idBooking,
        tax: process.env.TAX,
        subTotal: checkBookingStatus.offeringPrice,
        total:
          checkBookingStatus.offeringPrice +
          checkBookingStatus.offeringPrice * (process.env.TAX / 100),
      });

      if (!payment) {
        return res.status(404).json({
          errors: ['Payment failed to create'],
          message: 'Update Booking Admin Failed',
          data: null,
        });
      }

      return res.status(200).json({
        errors: [],
        message:
          'Update Booking Admin successfully. Payment has been send to customer.',
        data: {
          ...booking.data,
          paymentId: payment.paymentId,
          tax: `${payment.tax}%`,
          subTotal: payment.subTotal,
          total: payment.total,
        },
      });
    }

    return res.status(200).json({
      errors: [],
      message: 'Update Booking Admin successfully',
      data: booking.data,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/bookingController.js:updateBookingAdmin - ' + error.message
      )
    );
  }
};

const updateBooking = async (req, res, next) => {
  try {
    const idBooking = req.params.bookingId;

    const check = await Booking.findByPk(idBooking);

    if (!check) {
      return res.status(404).json({
        errors: ['No booking found'],
        message: 'Update Booking Failed',
        data: null,
      });
    }

    const valid = {};

    if (isExists(req.body.startDateTime)) {
      valid.startDateTime = 'required';
    }

    if (isExists(req.body.adminMessage)) {
      valid.endDateTime = 'required';
    }

    if (isExists(req.body.addOns)) {
      valid.addOns = 'required';
    }

    if (isExists(req.body.offeringPrice)) {
      valid.offeringPrice = 'required';
    }

    if (isExists(req.body.totalPersons)) {
      valid.totalPersons = 'required';
    }

    const booking = await dataValid(valid, req.body);

    if (booking.message.length > 0) {
      return res.status(400).json({
        errors: booking.message,
        message: 'Update Booking Failed',
        data: null,
      });
    }

    const result = await Booking.update(
      {
        ...booking.data,
        bookingStatus: status[0],
        adminMessage: null,
      },
      {
        where: {
          bookingId: idBooking,
        },
      }
    );

    if (result[0] == 0) {
      return res.status(404).json({
        errors: ['Booking not found'],
        message: 'Update Booking Failed',
        data: null,
      });
    }

    return res.status(200).json({
      errors: [],
      message: 'Update Booking successfully',
      data: booking.data,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/bookingController.js:updateBooking - ' + error.message
      )
    );
  }
};

export {
  setBooking,
  getAllBooking,
  getBookingDetail,
  getAllBookingAdmin,
  updateBookingAdmin,
  updateBooking,
  status,
};
