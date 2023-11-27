import sequelize from '../utils/db.js';
import { dataValid } from '../validation/dataValidation.js';
import Booking from '../models/bookingModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import { Op } from 'sequelize';
import { isExists } from '../validation/sanitization.js';
import Payment from '../models/paymentModel.js';
import 'dotenv/config';
import {
  // sendBookingOfferingToAdmin,
  sendPayment,
  // sendUpdateBookingOfferingToAdmin,
} from '../utils/sendMail.js';
import { getUserIdFromAccessToken } from '../utils/jwt.js';

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
    'Your payment has been recieved and we will contact you to start the journey. Thank you.',
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

    const user = await User.findOne({
      where: {
        userId: newBooking.userId,
      },
      attributes: ['name', 'country', 'email', 'phoneNumber'],
    });

    const product = await Product.findOne({
      where: {
        productId: newBooking.productId,
      },
      attributes: ['title'],
    });

    const formatBooking = {
      title: product.title,
      name: user.name,
      country: user.country ? user.country : null,
      email: user.email,
      phoneNumber: user.phoneNumber ? user.phoneNumber : null,
      bookingId: newBooking.bookingId,
      startDateTime: newBooking.startDateTime,
      endDateTime: newBooking.endDateTime ? newBooking.endDateTime : null,
      offeringPrice: newBooking.offeringPrice,
      addOns: newBooking.addOns,
      totalPersons: newBooking.totalPersons,
      createdAt: newBooking.createdAt,
      updatedAt: newBooking.updatedAt,
      bookingStatus: newBooking.bookingStatus,
      note: note.offering,
    };

    // const sendPaymentMail = await sendBookingOfferingToAdmin(
    //   process.env.ADMIN_EMAIL,
    //   formatBooking
    // );

    // if (!sendPaymentMail) {
    //   await t.rollback();
    //   return res.status(404).json({
    //     errors: ['Email booking confirmation failed to send to Admin'],
    //     message: 'Update Booking Admin Failed',
    //     data: null,
    //   });
    // }

    return res.status(200).json({
      errors: [],
      message:
        'Booking successfully, email confirmation has been sent to Admin',
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
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const tokenInfo = getUserIdFromAccessToken(token);
    const user_id = tokenInfo.userId;

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

    const formattedBooking = async () => {
      const bookings = await Promise.all(
        result.map(async (booking) => {
          const bookingNote = await getNote(booking.bookingId);

          return {
            bookingId: booking.bookingId,
            bookingDate: booking.createdAt,
            bookingStatus: booking.bookingStatus,
            bookingNote: bookingNote,
            title: booking.Product ? booking.Product.title : null,
            rating: booking.Product ? booking.Product.rating : null,
            location: booking.Product ? booking.Product.location : null,
          };
        })
      );

      return bookings;
    };

    const resultFormattedBooking = await formattedBooking();

    return res.status(200).json({
      errors: [],
      message: 'Get All Booking Successfully',
      data: resultFormattedBooking,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/bookingController.js:getAllBooking - ' + error.message
      )
    );
  }
};

const deleteBooking = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const booking_id = req.params.bookingId;

    const checkBooking = await Booking.findOne({
      where: {
        bookingId: booking_id,
        bookingStatus: {
          [Op.or]: [status[0], status[2], status[4]],
        },
      },
    });

    if (!checkBooking) {
      return res.status(404).json({
        errors: [
          'No booking found or cannot delete booking with status waiting for payment, payment reviewing or success',
        ],
        message: 'Delete Booking Failed',
        data: null,
      });
    }

    const deleteABooking = await Booking.destroy({
      where: {
        bookingId: booking_id,
      },
      transaction: t,
    });

    if (!deleteABooking) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Failed to delete booking from database'],
        message: 'Delete Booking Failed',
        data: null,
      });
    }

    await t.commit();

    return res.status(200).json({
      errors: [],
      message: 'Delete Booking Successfully',
      data: null,
    });
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/bookingController.js:deleteBooking - ' + error.message
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
      endDateTime: result.endDateTime !== null ? result.endDateTime : undefined,
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
  const t = await sequelize.transaction();
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

      const payment = await Payment.create(
        {
          bookingId: idBooking,
          tax: process.env.TAX,
          subTotal: checkBookingStatus.offeringPrice,
          total:
            checkBookingStatus.offeringPrice +
            checkBookingStatus.offeringPrice * (process.env.TAX / 100),
        },
        {
          transaction: t,
        }
      );

      if (!payment) {
        await t.rollback();
        return res.status(404).json({
          errors: ['Payment failed to create'],
          message: 'Update Booking Admin Failed',
          data: null,
        });
      }

      const userData = await Booking.findOne({
        attributes: ['userId', 'productId', 'createdAt'],
        where: {
          bookingId: idBooking,
        },
        include: [
          {
            model: User,
            attributes: ['name', 'email'],
          },
          {
            model: Product,
            attributes: ['title'],
          },
        ],
      });

      const dataPaymentsDetail = {
        name: userData.User.name,
        title: userData.Product.title,
        bookingId: idBooking,
        bookingDate: userData.createdAt,
        tax: payment.tax,
        subTotal: payment.subTotal,
        total: payment.total,
      };

      const sendPaymentMail = await sendPayment(
        userData.User.email,
        dataPaymentsDetail
      );

      if (!sendPaymentMail) {
        await t.rollback();
        return res.status(404).json({
          errors: ['Email payment confirmation failed to send to Customer'],
          message: 'Update Booking Admin Failed',
          data: null,
        });
      }

      await t.commit();

      return res.status(200).json({
        errors: [],
        message:
          'Update Booking Admin successfully. Email payment confirmation has been send to customer.',
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
  const t = await sequelize.transaction();
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
      },
      {
        transaction: t,
      }
    );

    if (result[0] == 0) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Booking not found'],
        message: 'Update Booking Failed',
        data: null,
      });
    }

    await t.commit();

    const data = await Booking.findOne({
      where: {
        bookingId: idBooking,
      },
      include: [
        {
          model: Product,
          attributes: ['title'],
        },
        {
          model: User,
          attributes: ['name', 'country', 'phoneNumber', 'email'],
        },
      ],
    });

    // const formatBooking = {
    //   title: data.Product.title,
    //   name: data.User.name,
    //   country: data.User.country ? data.User.country : null,
    //   email: data.User.email,
    //   phoneNumber: data.User.phoneNumber ? data.User.phoneNumber : null,
    //   bookingId: data.bookingId,
    //   startDateTime: data.startDateTime,
    //   endDateTime: data.endDateTime ? data.endDateTime : null,
    //   offeringPrice: data.offeringPrice,
    //   addOns: data.addOns,
    //   totalPersons: data.totalPersons,
    // };

    // const sendPaymentMail = await sendUpdateBookingOfferingToAdmin(
    //   process.env.ADMIN_EMAIL,
    //   formatBooking
    // );

    // if (!sendPaymentMail) {
    //   await t.rollback();
    //   return res.status(404).json({
    //     errors: ['Email payment confirmation failed to send to Admin'],
    //     message: 'Update Booking Admin Failed',
    //     data: null,
    //   });
    // }

    return res.status(200).json({
      errors: [],
      message:
        'Update Booking successfully, email confirmation has been sent to admin.',
      data: booking.data,
    });
  } catch (error) {
    await t.rollback();
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
  deleteBooking,
  getBookingDetail,
  getAllBookingAdmin,
  updateBookingAdmin,
  updateBooking,
  status,
};
