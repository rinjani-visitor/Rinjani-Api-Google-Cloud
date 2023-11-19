import sequelize from '../utils/db.js';
import { dataValid } from '../validation/dataValidation.js';
import Payment from '../models/paymentModel.js';
import BankPayment from '../models/bankPaymentModel.js';
import Booking from '../models/bookingModel.js';
import { status } from './bookingController.js';
import WisePayment from '../models/wisePaymentModel.js';

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
  };
  try {
    const bankPayment = await dataValid(valid, req.body);

    if (bankPayment.message.length > 0) {
      return res.status(400).json({
        errors: bankPayment.message,
        message: 'Payment via Bank Failed',
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

    const proofTransfer = req.file.filename;

    if (!proofTransfer) {
      return res.status(400).json({
        errors: ['Image Proof Transfer is required'],
        message: 'Payment via Bank Failed',
        data: null,
      });
    } else {
      const finalName =
        process.env.BASE_URL + '/images/payment/bank/' + proofTransfer;
      const result = await BankPayment.create(
        {
          bankName: bankPayment.data.bankName,
          bankAccountName: bankPayment.data.bankAccountName,
          imageProofTransfer: finalName,
          paymentId: getPaymentId.paymentId,
        },
        {
          transaction: t,
        }
      );
      if (result[0] == 0) {
        await t.rollback();
        return res.status(404).json({
          errors: ['Failed to save url photo to database'],
          message: 'Update Failed',
          data: null,
        });
      } else {
        await t.commit();

        const updateBookingStatus = await Booking.update(
          {
            bookingStatus: status[3],
          },
          {
            where: {
              bookingId: bankPayment.data.bookingId,
            },
          }
        );

        if (!updateBookingStatus) {
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
          }
        );

        if (!updatePaymentStatus) {
          return res.status(404).json({
            errors: ['Payment not found'],
            message: 'Payment via Bank Failed',
            data: null,
          });
        }

        return res.status(201).json({
          errors: [],
          message:
            'Payment via Bank has been send successfully, please check booking details',
          data: {
            paymentId: result.paymentId,
            bookingId: bankPayment.data.bookingId,
            method: 'Bank',
            bankName: result.bankName,
            bankAccountName: result.bankAccountName,
            imageProofTransfer: result.imageProofTransfer,
            createAt: result.createAt,
          },
        });
      }
    }
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
  };
  try {
    const wisePayment = await dataValid(valid, req.body);

    if (wisePayment.message.length > 0) {
      return res.status(400).json({
        errors: wisePayment.message,
        message: 'Payment via Wise Failed',
        data: null,
      });
    }

    const getPaymentId = await Payment.findOne({
      where: {
        bookingId: wisePayment.data.bookingId,
        method: 'Wise',
      },
    });

    if (!getPaymentId) {
      return res.status(404).json({
        errors: ['Get Payment ID fail'],
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

    const proofTransfer = req.file.filename;

    if (!proofTransfer) {
      return res.status(400).json({
        errors: ['Image Proof Transfer is required'],
        message: 'Payment via Wise Failed',
        data: null,
      });
    } else {
      const finalName =
        process.env.BASE_URL + '/images/payment/wise/' + proofTransfer;
      const result = await WisePayment.create(
        {
          wiseEmail: wisePayment.data.wiseEmail,
          wiseAccountName: wisePayment.data.wiseAccountName,
          imageProofTransfer: finalName,
          paymentId: getPaymentId.paymentId,
        },
        {
          transaction: t,
        }
      );
      if (result[0] == 0) {
        await t.rollback();
        return res.status(404).json({
          errors: ['Failed to save url photo to database'],
          message: 'Update Failed',
          data: null,
        });
      } else {
        await t.commit();

        const updateBookingStatus = await Booking.update(
          {
            bookingStatus: status[3],
          },
          {
            where: {
              bookingId: wisePayment.data.bookingId,
            },
          }
        );

        if (!updateBookingStatus) {
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
          return res.status(404).json({
            errors: ['Payment not found'],
            message: 'Payment via Wise Failed',
            data: null,
          });
        }

        return res.status(201).json({
          errors: [],
          message:
            'Payment via Wise has been send successfully, please check booking details',
          data: {
            paymentId: result.paymentId,
            bookingId: wisePayment.data.bookingId,
            method: 'Wise',
            wiseEmail: result.wiseEmail,
            wiseAccountName: result.wiseAccountName,
            imageProofTransfer: result.imageProofTransfer,
            createdAt: result.createdAt,
          },
        });
      }
    }
  } catch (error) {
    next(
      new Error(
        'controllers/bookingController.js:setWisePayment - ' + error.message
      )
    );
  }
};

export { updateBankWiseMethodPayment, setBankPayment, setWisePayment };