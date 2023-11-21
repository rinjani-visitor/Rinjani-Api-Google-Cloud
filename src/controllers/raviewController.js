import Review from '../models/reviewModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import sequelize from '../utils/db.js';
import { dataValid } from '../validation/dataValidation.js';

const setReview = async (req, res, next) => {
  const t = await sequelize.transaction();
  const valid = {
    messageReview: 'required',
    rating: 'required, isDecimal',
    productId: 'required',
    userId: 'required',
    orderId: 'required',
  };
  try {
    const product_id = req.body.productId;
    const user_id = req.body.userId;
    const order_id = req.body.orderId;

    const review = await dataValid(valid, req.body);
    if (review.message.length > 0) {
      return res.status(400).json({
        errors: review.message,
        message: 'Create Review Failed',
        data: null,
      });
    }

    if (!product_id || !user_id) {
      return res.status(400).json({
        errors: ['productId, userId and/or orderId is required'],
        message: 'Create Review Failed',
        data: null,
      });
    }

    const product = await Product.findByPk(product_id);
    const user = await User.findByPk(user_id);

    if (!product || !user) {
      return res.status(404).json({
        errors: ['Product or User not found'],
        message: 'Create Review Failed',
        data: null,
      });
    }

    const cekOrder = await Review.findOne({
      where: {
        orderId: order_id,
      },
      transaction: t,
    });

    if (cekOrder) {
      return res.status(400).json({
        errors: ['Order already reviewed'],
        message: 'Create Review Failed',
        data: null,
      });
    }

    const result = await Review.create(
      {
        messageReview: review.data.messageReview,
        rating: review.data.rating,
        productId: product_id,
        userId: user_id,
        orderId: order_id,
      },
      {
        transaction: t,
      }
    );

    if (result[0] == 0) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Failed to save review to database'],
        message: 'Update Failed',
        data: null,
      });
    }

    const updateStatusOrder = await Order.update(
      {
        orderStatus: 'Finished',
      },
      {
        where: {
          orderId: order_id,
        },
        transaction: t,
      }
    );

    if (updateStatusOrder[0] == 0) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Failed to update order status'],
        message: 'Update Failed',
        data: null,
      });
    }

    await t.commit();

    const ratingAll = await countRating(product_id);
    console.log('ratingAll', ratingAll);

    return res.status(201).json({
      errors: [],
      message: 'Review created successfully',
      data: result,
    });
  } catch (error) {
    await t.rollback();
    next(
      new Error('controllers/raviewController.js:setReview - ' + error.message)
    );
  }
};

const countRating = async (id_product) => {
  const t = await sequelize.transaction();

  const getAllRating = await Review.findAll({
    attributes: ['rating'],
    where: {
      productId: id_product,
    },
  });

  // Extract ratings from the instances
  const ratings = getAllRating.map((review) => review.rating);

  // Calculate average rating
  const averageRating =
    ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

  const updateRatingProduct = await Product.update(
    {
      rating: averageRating,
    },
    {
      where: {
        productId: id_product,
      },
    }
  );

  await t.commit();

  return averageRating;
};

export default setReview;
