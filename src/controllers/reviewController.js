import Review from '../models/reviewModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import sequelize from '../utils/db.js';
import { dataValid } from '../validation/dataValidation.js';
import { getUserIdFromAccessToken } from '../utils/jwt.js';

const setReview = async (req, res, next) => {
  const t = await sequelize.transaction();
  const valid = {
    messageReview: 'required',
    rating: 'required, isDecimal',
    orderId: 'required',
  };
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const tokenInfo = getUserIdFromAccessToken(token);
    const user_id = tokenInfo.userId;

    const order_id = req.body.orderId;

    const review = await dataValid(valid, req.body);
    if (review.message.length > 0) {
      return res.status(400).json({
        errors: review.message,
        message: 'Create Review Failed',
        data: null,
      });
    }

    if (!order_id) {
      return res.status(400).json({
        errors: ['orderId is required'],
        message: 'Create Review Failed',
        data: null,
      });
    }

    const getProductId = await Order.findOne({
      where: {
        orderId: order_id,
      },
      attributes: ['productId'],
      transaction: t,
    });

    const product = await Product.findByPk(getProductId.productId);
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
        productId: getProductId.productId,
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

    await countRating(getProductId.productId);

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

  const ratingFinal = Number(averageRating.toFixed(1));

  await Product.update(
    {
      rating: ratingFinal,
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

const getAllReview = async (req, res, next) => {
  try {
    const allReview = await Review.findAll({
      attributes: ['rating', 'messageReview', 'createdAt'],
      include: [
        {
          model: User,
          attributes: ['name', 'profilPicture', 'country'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    if (!allReview) {
      return res.status(400).json({
        errors: ['Get All Review Fail'],
        message: 'Review not found',
        data: null,
      });
    }

    const formattedReview = allReview.map((review) => ({
      review: review.review,
      messageReview: review.messageReview,
      createdAt: review.createdAt,
      name: review.User ? review.User.name : null,
      profilPicture: review.User ? review.User.profilPicture : null,
      country: review.User ? review.User.country : null,
    }));

    return res.status(201).json({
      errors: [],
      message: 'Get all review successfully',
      data: formattedReview,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/raviewController.js:getAllReview - ' + error.message
      )
    );
  }
};

export { setReview, getAllReview };
