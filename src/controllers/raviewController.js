import Review from '../models/reviewModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import sequelize from '../utils/db.js';
import { dataValid } from '../validation/dataValidation.js';

const setReview = async (req, res, next) => {
  const t = await sequelize.transaction();
  const valid = {
    review: 'required',
    rating: 'required, isDecimal',
    productId: 'required',
    userId: 'required',
  };
  try {
    const product_id = req.body.productId;
    const user_id = req.body.userId;

    
    const review = await dataValid(valid, req.body);
    if (review.message.length > 0) {
      return res.status(400).json({
        errors: review.message,
        message: 'Create Review Failed',
        data: null,
      });
    };

    if (!product_id || !user_id) {
      return res.status(400).json({
        errors: ['productId and userId is required'],
        message: 'Create Review Failed',
        data: null,
      })
    };

    const product = await Product.findByPk(product_id);
    const user = await User.findByPk(user_id);

    if(!product || !user){
      return res.status(404).json({
        errors: ['Product or User not found'],
        message: 'Create Review Failed',
        data: null,
      })
    };

    const result = await Review.create(
        {
          ...review.data,
          productId: product_id,
          userId: user_id
        },
        {
          transaction: t,
        }
    );

    if (result[0] == 0) {
      return res.status(404).json({
        errors: ['Failed to save review to database'],
        message: 'Update Failed',
        data: null,
      });
    };

    await t.commit();
    return res.status(201).json({
      errors: [],
      message: 'Review created successfully',
      data: result,
    })

  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/raviewController.js:setReview - ' + error.message
      )
    );
  }
};

export default setReview;
