import moment from 'moment';
import 'dotenv/config';
import sequelize from '../utils/db.js';
import { dataValid } from '../validation/dataValidation.js';
import Payment from '../models/paymentModel.js';
import BankPayment from '../models/bankPaymentModel.js';
import Booking from '../models/bookingModel.js';
import { status as statusBooking } from './bookingController.js';
import WisePayment from '../models/wisePaymentModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import {
  sendBookingSuccess,
  sendBookingFailed,
  sendBankPaymentToAdmin,
} from '../utils/sendMail.js';
import { adminEmails } from '../utils/emailAdmin.js';

const updateBankWiseMethodPayment = async (req, res, next) => {
  const valid = {
    bookingId: 'required',
    method: 'required',
  };
  try {
    const payment = await dataValid(valid, req.body);

    if (payment.message.length > 0) {
      return res.status(400).json({
        errors: payment.message,
        message: 'Payment Failed',
        data: null,
      });
    }

    const checkPayment = await Payment.findOne({
      where: {
        bookingId: payment.data.bookingId,
      },
    });

    if (!checkPayment) {
      return res.status(404).json({
        errors: ['Payment not found'],
        message: 'Payment Failed',
        data: null,
      });
    }

    const updateMethodPayment = await Payment.update(
      {
        method: payment.data.method,
      },
      {
        where: {
          bookingId: payment.data.bookingId,
        },
      }
    );

    if (!updateMethodPayment) {
      return res.status(404).json({
        errors: ['Booking not found'],
        message: 'Payment Failed',
        data: null,
      });
    }

    return res.status(200).json({
      errors: [],
      message: 'Update Payment Method Success',
    });
  } catch (error) {
    next(
      new Error(
        'controllers/bookingController.js:setPayment - ' + error.message
      )
    );
  }
};

const setBankPayment = async (req, res, next) => {
  const t = await sequelize.transaction();
  const valid = {
    bookingId: 'required',
    bankName: 'required',
    bankAccountName: 'required',
    imageProofTransfer: 'required',
  };
  try {
    const bankPayment = await dataValid(valid, req.body);

    if (bankPayment.message.length > 0) {
      return res.status(400).json({
        errors: bankPayment.message,
        message: 'Payment via Bank Failed, please Set Method Bank first',
        data: null,
      });
    }

    const getPaymentId = await Payment.findOne({
      where: {
        bookingId: bankPayment.data.bookingId,
        method: 'Bank',
      },
    });

    if (!getPaymentId) {
      return res.status(404).json({
        errors: ['Get Payment ID fail'],
        message: 'Payment via Bank Failed',
        data: null,
      });
    }

    const checkBankPayment = await BankPayment.findOne({
      where: {
        paymentId: getPaymentId.paymentId,
      },
    });

    if (checkBankPayment) {
      return res.status(400).json({
        errors: ['Payment via Bank already exists'],
        message: 'Payment via Bank Failed',
        data: null,
      });
    }

    const result = await BankPayment.create({
      bankName: bankPayment.data.bankName,
      bankAccountName: bankPayment.data.bankAccountName,
      imageProofTransfer: req.body.imageProofTransfer,
      paymentId: getPaymentId.paymentId,
    });

    if (!result) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Failed to save data to database'],
        message: 'Update Failed',
        data: null,
      });
    }

    const updateBookingStatus = await Booking.update(
      {
        bookingStatus: statusBooking[3],
      },
      {
        where: {
          bookingId: bankPayment.data.bookingId,
        },
      },
      {
        transaction: t,
      }
    );

    if (!updateBookingStatus) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Booking not found'],
        message: 'Payment via Bank Failed',
        data: null,
      });
    }

    const updatePaymentStatus = await Payment.update(
      {
        paymentStatus: 'Need a Review',
      },
      {
        where: {
          paymentId: getPaymentId.paymentId,
        },
      },
      {
        transaction: t,
      }
    );

    if (!updatePaymentStatus) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Payment not found'],
        message: 'Payment via Bank Failed',
        data: null,
      });
    }

    const formattedPayment = {
      paymentId: result.paymentId,
      bookingId: bankPayment.data.bookingId,
      method: 'Bank',
      bankName: result.bankName,
      bankAccountName: result.bankAccountName,
      imageProofTransfer: result.imageProofTransfer,
      createdAt: moment(result.createdAt).tz('Asia/Singapore').format('YYYY-MM-DD HH:mm:ss'),
    };

    let sendPaymentMails = [];
    for (const adminEmail of adminEmails) {
      const sendPaymentMail = sendBankPaymentToAdmin(
        adminEmail,
        formattedPayment
      ); // Menghapus await di sini agar pengiriman email dilakukan secara paralel
      sendPaymentMails.push(sendPaymentMail); // Menambahkan promise ke array
    }

    // Menunggu semua email terkirim atau gagal
    const results = await Promise.all(sendPaymentMails);

    // Memeriksa apakah setidaknya satu email gagal terkirim
    if (results.some((result) => !result)) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Email payment confirmation failed to send to Admin'],
        message: 'Update Booking Admin Failed',
        data: null,
      });
    }

    await t.commit();

    return res.status(201).json({
      errors: [],
      message:
        'Payment via Bank has been send successfully, please check booking details',
      data: formattedPayment,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/bookingController.js:setBankPayment - ' + error.message
      )
    );
  }
};

const setWisePayment = async (req, res, next) => {
  const t = await sequelize.transaction();
  const valid = {
    bookingId: 'required',
    wiseEmail: 'required,isEmail',
    wiseAccountName: 'required',
    imageProofTransfer: 'required',
  };
  try {
    const wisePaymentBody = await dataValid(valid, req.body);

    if (wisePaymentBody.message.length > 0) {
      return res.status(400).json({
        errors: wisePaymentBody.message,
        message: 'Payment via Wise Failed',
        data: null,
      });
    }

    const getPaymentId = await Payment.findOne({
      where: {
        bookingId: wisePaymentBody.data.bookingId,
        method: 'Wise',
      },
    });

    if (!getPaymentId) {
      return res.status(404).json({
        errors: ['Get Payment ID fail, please Set Method Wise First'],
        message: 'Payment via Wise Failed',
        data: null,
      });
    }

    const checkWisePayment = await WisePayment.findOne({
      where: {
        paymentId: getPaymentId.paymentId,
      },
    });

    if (checkWisePayment) {
      return res.status(400).json({
        errors: ['Payment via Wise already exists'],
        message: 'Payment via Wise Failed',
        data: null,
      });
    }

    console.log(wisePaymentBody.data);

    const result = await WisePayment.create({
      wiseEmail: wisePaymentBody.data.wiseEmail,
      wiseAccountName: wisePaymentBody.data.wiseAccountName,
      imageProofTransfer: req.body.imageProofTransfer,
      paymentId: getPaymentId.paymentId,
    });

    console.log(result);

    if (!result) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Failed to save url photo to database'],
        message: 'Update Failed',
        data: null,
      });
    }

    const updateBookingStatus = await Booking.update(
      {
        bookingStatus: statusBooking[3],
      },
      {
        where: {
          bookingId: wisePaymentBody.data.bookingId,
        },
      }
    );

    if (!updateBookingStatus) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Booking not found'],
        message: 'Payment via Wise Failed',
        data: null,
      });
    }

    const updatePaymentStatus = await Payment.update(
      {
        paymentStatus: 'Need a Review',
      },
      {
        where: {
          paymentId: getPaymentId.paymentId,
        },
      }
    );

    if (!updatePaymentStatus) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Payment not found'],
        message: 'Payment via Wise Failed',
        data: null,
      });
    }

    const formattedPayment = {
      paymentId: result.paymentId,
      bookingId: wisePaymentBody.data.bookingId,
      method: 'Wise',
      wiseEmail: result.wiseEmail,
      wiseAccountName: result.wiseAccountName,
      imageProofTransfer: result.imageProofTransfer,
      createdAt: moment(result.createdAt).tz('Asia/Singapore').format('YYYY-MM-DD HH:mm:ss'),
    };

    let sendPaymentMails = [];
    for (const adminEmail of adminEmails) {
      const sendPaymentMail = sendBankPaymentToAdmin(
        adminEmail,
        formattedPayment
      ); // Menghapus await di sini agar pengiriman email dilakukan secara paralel
      sendPaymentMails.push(sendPaymentMail); // Menambahkan promise ke array
    }

    // Menunggu semua email terkirim atau gagal
    const results = await Promise.all(sendPaymentMails);

    // Memeriksa apakah setidaknya satu email gagal terkirim
    if (results.some((result) => !result)) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Email payment confirmation failed to send to Admin'],
        message: 'Update Booking Admin Failed',
        data: null,
      });
    }

    await t.commit();

    return res.status(201).json({
      errors: [],
      message:
        'Payment via Wise has been send successfully, please check booking details',
      data: formattedPayment,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/bookingController.js:setWisePayment - ' + error.message
      )
    );
  }
};

const getPaymentById = async (req, res, next) => {
  try {

    const booking_id = req.params.bookingId;

    const result = await Payment.findOne({
      where: {
        bookingId: booking_id
      },
      include: [
        {
          model: Booking,
          attributes: ['bookingId', 'productId'],
          include: [
            {
              model: Product,
              attributes: ['title', 'rating', 'location', 'thumbnail'],
            },
          ],
        },
      ],
    });

    if (!result) {
      return res.status(404).json({
        errors: ['Payment not found'],
        message: 'Get Payment by booking id failed',
        data: null,
      });
    }

    const formatResult = {
      paymentId: result.paymentId,
      tax: result.tax,
      subTotal: result.subTotal,
      total: result.total,
      method: result.method,
      paymentStatus: result.paymentStatus,
      bookingId: result.Booking.bookingId,
      productId: result.Booking.Product.productId,
      title: result.Booking.Product.title,
      rating: result.Booking.Product.rating,
      location: result.Booking.Product.location,
      thumbnail: result.Booking.Product.thumbnail,
    }

    return res.status(200).json({
      errors: [],
      message: 'Get Payment by booking id successfully',
      data: formatResult,
    })
  } catch (error) {
    next(
      new Error(
        'controllers/paymentController.js:getPaymentById - ' + error.message
      )
    )
  }
}

const getAllPaymentAdmin = async (req, res, next) => {
  try {
    const result = await Payment.findAll({
      attributes: ['paymentId', 'total', 'method', 'paymentStatus', 'updatedAt'],
      include: [
        {
          model: Booking,
          attributes: ['bookingId', 'productId', 'userId'],
          include: [
            {
              model: User,
              attributes: ['name', 'country'],
            },
            {
              model: Product,
              attributes: ['title'],
            },
          ],
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    if (!result) {
      return res.status(404).json({
        errors: ['No payment found'],
        message: 'Get All Payment Failed',
        data: null,
      });
    }

    const formattedPayment = result.map((payment) => ({
      paymentId: payment.paymentId,
      bookingId: payment.Booking.bookingId ? payment.Booking.bookingId : null,
      title: payment.Booking.Product ? payment.Booking.Product.title : null,
      total: payment.total,
      method: payment.method,
      paymentStatus: payment.paymentStatus,
      customerName: payment.Booking.User ? payment.Booking.User.name : null,
      customerCountry: payment.Booking.User
        ? payment.Booking.User.country
        : null,
      updatePaymentDate: payment.updatedAt,
    }));

    const sortedPayments = formattedPayment.sort((a, b) => {
      return new Date(b.updatePaymentDate) - new Date(a.updatePaymentDate);
    });

    return res.status(200).json({
      errors: [],
      message: 'Get All Payment Admin Success',
      data: sortedPayments,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/paymentController.js:getAllPaymentAdmin - ' + error.message
      )
    );
  }
};

const getPaymentDetailAdmin = async (req, res, next) => {
  try {
    const idPayment = req.params.paymentId;

    const resultPayment = await Payment.findOne({
      where: {
        paymentId: idPayment,
      },
      attributes: [
        'paymentId',
        'tax',
        'subTotal',
        'total',
        'method',
        'paymentStatus',
      ],
      include: [
        {
          model: Booking,
          attributes: ['productId', 'userId'],
          include: [
            {
              model: User,
              attributes: ['name', 'country'],
            },
            {
              model: Product,
              attributes: ['title'],
            },
          ],
        },
      ],
    });

    if (!resultPayment) {
      return res.status(404).json({
        errors: ['No payment found'],
        message: 'Get Payment Detail Failed',
        data: null,
      });
    }

    if (!resultPayment.method) {
      const formattedPayment = {
        paymentId: resultPayment.paymentId,
        title: resultPayment.Booking.Product
          ? resultPayment.Booking.Product.title
          : null,
        total: resultPayment.total,
        method: resultPayment.method,
        paymentStatus: resultPayment.paymentStatus,
        customerName: resultPayment.Booking.User
          ? resultPayment.Booking.User.name
          : null,
        customerCountry: resultPayment.Booking.User
          ? resultPayment.Booking.User.country
          : null,
        paymentDate: resultPayment.createdAt ? resultPayment.createdAt : null,
      };

      return res.status(200).json({
        errors: [],
        message:
          'Get Payment Detail Success, But Customer Not Already Set for Method Payment',
        data: formattedPayment,
      });
    }

    let resultPaymentMethod;

    if (resultPayment.method == 'Bank') {
      resultPaymentMethod = await BankPayment.findOne({
        attributes: [
          'bankName',
          'bankAccountName',
          'imageProofTransfer',
          'createdAt',
        ],
        where: {
          paymentId: resultPayment.paymentId,
        },
      });
    } else if (resultPayment.method == 'Wise') {
      resultPaymentMethod = await WisePayment.findOne({
        attributes: [
          'wiseEmail',
          'wiseAccountName',
          'imageProofTransfer',
          'createdAt',
        ],
        where: {
          paymentId: resultPayment.paymentId,
        },
      });
    }

    const formattedPayment = {
      paymentId: resultPayment.paymentId,
      paymentStatus: resultPayment.paymentStatus,
      tax: resultPayment.tax,
      subTotal: resultPayment.subTotal,
      total: resultPayment.total,
      method: resultPayment.method,
      bankNameOrWiseEmail: resultPaymentMethod.bankName
        ? resultPaymentMethod.bankName
        : resultPaymentMethod.wiseEmail,
      bankAccountNameOrWiseAccountName: resultPaymentMethod.bankAccountName
        ? resultPaymentMethod.bankAccountName
        : resultPaymentMethod.wiseAccountName,
      imageProofTransfer: resultPaymentMethod.imageProofTransfer,
      paymentDate: resultPaymentMethod.createdAt,
      title: resultPayment.Booking.Product.title,
      customerName: resultPayment.Booking.User.name,
      customerCountry: resultPayment.Booking.User.country,
    };

    return res.status(200).json({
      errors: [],
      message: 'Get Payment Detail Admin Success',
      data: formattedPayment,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/paymentController.js:getPaymentDetailAdmin - ' +
          error.message
      )
    );
  }
};

const updatePaymentAdmin = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const idPayment = req.params.paymentId;

    const cekPayment = await Payment.findOne({
      where: {
        paymentId: idPayment,
      },
    });

    if (!cekPayment) {
      return res.status(404).json({
        errors: ['No payment found'],
        message: 'Update Payment Failed',
        data: null,
      });
    }

    const status = req.body.paymentStatus;

    if (!status) {
      return res.status(400).json({
        errors: ['Payment status is required'],
        message: 'Update Payment Failed',
        data: null,
      });
    }

    const getBookingId = await Payment.findOne({
      where: {
        paymentId: idPayment,
      },
      attributes: ['bookingId'],
    });

    if (!getBookingId) {
      await t.rollback();
      return res.status(404).json({
        errors: ['No booking found'],
        message: 'Update Payment Failed',
        data: null,
      });
    }

    const getDataUserBooking = await Booking.findOne({
      attributes: ['bookingId', 'createdAt', 'startDateTime', 'endDateTime'],
      where: {
        bookingId: getBookingId.bookingId,
      },
      include: [
        {
          model: User,
          attributes: ['userId', 'name', 'email'],
        },
        {
          model: Product,
          attributes: ['productId', 'title'],
        },
      ],
    });

    if (!getDataUserBooking) {
      return res.status(404).json({
        errors: ['No booking found'],
        message: 'Send email confirmation failed',
        data: null,
      });
    }

    if (status == 'Rejected') {
      const updateBooking = await Booking.update(
        {
          bookingStatus: statusBooking[4],
        },
        {
          where: {
            bookingId: getBookingId.bookingId,
          },
        },
        {
          transaction: t,
        }
      );

      if (!updateBooking) {
        await t.rollback();
        return res.status(404).json({
          errors: ['No booking found'],
          message: 'Update Payment Failed',
          data: null,
        });
      }

      const destroyPayment = await Payment.destroy({
        where: {
          paymentId: idPayment,
        },
        transaction: t,
      });

      if (!destroyPayment) {
        await t.rollback();
        return res.status(404).json({
          errors: ['No payment found'],
          message: 'Update Payment Failed',
          data: null,
        });
      }

      const email = getDataUserBooking.User.email;
      const dataUserBooking = {
        name: getDataUserBooking.User.name,
        title: getDataUserBooking.Product.title,
        bookingId: getDataUserBooking.bookingId,
        bookingDate: getDataUserBooking.createdAt,
        bookingStatus: statusBooking[4],
      };

      const sendBookingFailedMail = await sendBookingFailed(
        email,
        dataUserBooking
      );

      if (!sendBookingFailedMail) {
        await t.rollback();
        return res.status(404).json({
          errors: ['Failed to send email'],
          message: 'Send email confirmation failed',
          data: null,
        });
      }

      await t.commit();

      return res.status(200).json({
        errors: [],
        message:
          'Payment has been rejected and destroyed. Email confirmation has been sent to the customer.',
        data: null,
      });
    } else if (status == 'Approved') {
      const updateBooking = await Booking.update(
        {
          bookingStatus: statusBooking[5],
        },
        {
          where: {
            bookingId: getBookingId.bookingId,
          },
        },
        {
          transaction: t,
        }
      );

      if (!updateBooking) {
        await t.rollback();
        return res.status(404).json({
          errors: ['No booking found'],
          message: 'Update Payment Failed',
          data: null,
        });
      }

      const updatePayment = await Payment.update(
        {
          paymentStatus: status,
        },
        {
          where: {
            paymentId: idPayment,
          },
          transaction: t,
        }
      );

      if (!updatePayment) {
        await t.rollback();
        return res.status(404).json({
          errors: ['No payment found'],
          message: 'Update Payment Failed',
          data: null,
        });
      }

      const checkOrder = await Order.findOne({
        where: {
          paymentId: idPayment,
        },
      });

      if (checkOrder) {
        await t.rollback();
        return res.status(404).json({
          errors: ['Order already created'],
          message: 'Update Payment Failed',
          data: null,
        });
      }

      const makeOrder = await Order.create(
        {
          paymentId: idPayment,
          userId: getDataUserBooking.User.userId,
          productId: getDataUserBooking.Product.productId,
        },
        {
          transaction: t,
        }
      );

      if (!makeOrder) {
        await t.rollback();
        return res.status(404).json({
          errors: ['No order found'],
          message: 'Update Payment Failed',
          data: null,
        });
      }

      const email = getDataUserBooking.User.email;
      const dataUserBooking = {
        name: getDataUserBooking.User.name,
        title: getDataUserBooking.Product.title,
        bookingId: getDataUserBooking.bookingId,
        bookingDate: getDataUserBooking.createdAt,
        bookingStart: getDataUserBooking.startDateTime,
        bookingEnd: getDataUserBooking.endDateTime,
      };

      const sendBookingSuccesMail = await sendBookingSuccess(
        email,
        dataUserBooking
      );

      if (!sendBookingSuccesMail) {
        await t.rollback();
        return res.status(404).json({
          errors: ['Failed to send email'],
          message: 'Send email confirmation failed',
          data: null,
        });
      }

      await t.commit();

      return res.status(200).json({
        errors: [],
        message:
          'Update Payment Success to Approved, Order created and email confirmation has been sent to the customer.',
        data: null,
      });
    }
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/paymentController.js:updatePaymentAdmin - ' + error.message
      )
    );
  }
};

export {
  updateBankWiseMethodPayment,
  setBankPayment,
  setWisePayment,
  getPaymentById,
  getAllPaymentAdmin,
  getPaymentDetailAdmin,
  updatePaymentAdmin,
};
