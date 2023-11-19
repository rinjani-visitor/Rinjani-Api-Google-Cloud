import sequelize from '../utils/db.js';
import { dataValid } from '../validation/dataValidation.js';
import Booking from '../models/bookingModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import { Op } from 'sequelize';

const note = {
  offering:
    'Your offer has been sent to the admin, please wait untill admin approve your offer',
  waiting:
    'Your offer has been approved by admin and please complete your payment to complete this booking.',
  declined:
    'Your offer has been declined by admin, you can make another offer to admin or make another booking.',
  paymentsend:
    'Your payment has been sent to the admin. We will inform you once the transaction has been accepted by admin.',
  success:
    'Your payment has been recieved and we will send you the trip detail through email. Thank you.',
};

const status = [
  'Offering',
  'Waiting for Payment',
  'Declined',
  'Payment Reviewing',
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
      [status[4]]: note.success,
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
      attributes: ['bookingId', 'bookingStatus'],
      where: {
        userId: user_id,
      },
      include: [
        {
          model: Product,
          attributes: ['title', 'thumbnail'],
        }
      ]
    });

    if (!result) {
      return res.status(404).json({
        errors: ['No booking found'],
        message: 'Get All Booking Failed',
        data: null,
      });
    }

    const formattedBooking = result.map((booking) => ({
      bookingId: booking.bookingId,
      title: booking.Product? booking.Product.title : null,
      thumbnail: booking.Product? booking.Product.thumbnail : null,
      bookingStatus: booking.bookingStatus,
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
        attributes: ['bookingId', 'bookingStatus'],
        where: {
          bookingStatus: {
            [Op.like]: `%${statusName}%`,
          },
        },
        include: [
          {
            model: Product,
            attributes: ['title', 'thumbnail', 'lowestPrice'],
          },
          {
            model: User,
            attributes: ['name'],
          }
        ]
      });
    } else {
      result = await Booking.findAll({
        include: [
          {
            model: Product,
            attributes: ['title', 'thumbnail', 'lowestPrice'],
          },
          {
            model: User,
            attributes: ['name', 'country'],
          }
        ]
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
      title: booking.Product? booking.Product.title : null,
      thumbnail: booking.Product? booking.Product.thumbnail : null,
      bookingStatus: booking.bookingStatus,
      customerName: booking.User? booking.User.name : null,
      customerCountry: booking.User? booking.User.country : null,
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
        'controllers/bookingController.js:getBookingDetailAdmin - ' + error.message
      )
    );
  }
};

export { setBooking, getAllBooking, getBookingDetail, getAllBookingAdmin};
