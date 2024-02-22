import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import Booking from '../models/bookingModel.js';
import Payment from '../models/paymentModel.js';
import Order from '../models/orderModel.js';
import Review from '../models/reviewModel.js';
import sequelize from 'sequelize';

// const countByBookingStatus = async (status) => {
//   return await Booking.count({
//     where: {
//       bookingStatus: status,
//     },
//   });
// };

const getDashboard = async (req, res, next) => {
  try {
    const productCount = await Product.count();
    const userCount = await User.count();
    const bookingCount = await Booking.count();
    const paymentCount = await Payment.count();
    const orderCount = await Order.count();
    const reviewCount = await Review.count();
    const averageRatingResult = await Review.findAll({
      attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'rating']],
    });
    const averageRating = parseFloat(averageRatingResult[0].rating).toFixed(2);

    res.status(200).json({
      productCount,
      userCount,
      bookingCount,
      paymentCount,
      orderCount,
      reviewCount,
      averageRating: parseFloat(averageRating),
    });
  } catch (error) {
    next(
      new Error('controllers/fotoController.js:getDashboard - ' + error.message)
    );
  }
};

const getDashboardUser = async (req, res, next) => {
  try {
    const productCount = await Product.count();
    const userCount = await User.count();
    const averageRatingResult = await Review.findAll({
      attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'rating']],
    });
    const averageRating = parseFloat(averageRatingResult[0].rating).toFixed(2);

    res.status(200).json({
      productCount,
      userCount,
      averageRating: parseFloat(averageRating),
    });
  } catch (error) {
    next(
      new Error('controllers/fotoController.js:getDashboardUser - ' + error.message)
    );
  }
};

export { getDashboard, getDashboardUser };
