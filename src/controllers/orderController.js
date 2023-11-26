import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import { getUserIdFromAccessToken } from '../utils/jwt.js';

const getAllOrder = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const tokenInfo = getUserIdFromAccessToken(token);
    const user_id = tokenInfo.userId;

    const order = await Order.findAll({
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

    if (!order) {
      return res.status(404).json({
        errors: ['Order not found'],
        message: 'No has order',
        data: null,
      });
    }

    const formattedOrder = order.map((order) => ({
      title: order.Product.title,
      rating: order.Product.rating ? order.Product.rating : 0,
      location: order.Product.location,
      status: order.orderStatus,
      orderId: order.orderId,
      orderApproveDate: order.createdAt,
    }));

    return res.status(200).json({
      errors: [],
      message: 'Get Order Success',
      data: formattedOrder,
    });
  } catch (error) {
    next(
      new Error('controllers/orderController.js:getAllOrder - ' + error.message)
    );
  }
};

const getAllOrderAdmin = async (req, res, next) => {
  try {
    const order = await Order.findAll({
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

    if (!order) {
      return res.status(404).json({
        errors: ['Order not found'],
        message: 'No has order',
        data: null,
      });
    }

    const formattedOrder = order.map((order) => ({
      title: order.Product.title,
      rating: order.Product.rating ? order.Product.rating : 0,
      location: order.Product.location,
      status: order.orderStatus,
      orderId: order.orderId,
      orderApproveDate: order.createdAt,
      customerName: order.User.name,
      customerCountry: order.User.country,
    }));

    return res.status(200).json({
      errors: [],
      message: 'Get Order Success',
      data: formattedOrder,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/orderController.js:getAllOrderAdmin - ' + error.message
      )
    );
  }
};

const cancelOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const order_id = req.params.orderId;

    const order = await Order.findOne({
      where: {
        orderId: order_id,
      },
    });

    if (!order) {
      return res.status(404).json({
        errors: ['Order not found'],
        message: 'Cancel Order Failed',
        data: null,
      });
    }

    const result = await Order.update(
      {
        orderStatus: 'Canceled',
      },
      {
        where: {
          orderId: order_id,
          userId: user_id,
        },
      }
    );

    if (result[0] == 0) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Order not found'],
        message: 'Cancel Order Failed',
        data: null,
      });
    }

    await t.commit();

    return res.status(200).json({
      errors: [],
      message: 'Cancel Order Success',
      data: null,
    });
  } catch (error) {
    next(
      new Error('controllers/orderController.js:cancelOrder - ' + error.message)
    );
  }
};

export { getAllOrder, getAllOrderAdmin, cancelOrder };
