import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import { getUserIdFromAccessToken } from '../utils/jwt.js';
import sequelize from '../utils/db.js';
import { sendOrderCancelToAdmin } from '../utils/sendMail.js';
import Review from '../models/reviewModel.js';
import { adminEmails } from '../utils/emailAdmin.js';

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
          attributes: ['productId', 'title', 'rating', 'location'],
        },
        {
          model: Review,
          attributes: ['rating', 'messageReview', 'createdAt'],
        }
      ],
      order: [['createdAt', 'DESC']],
    });

    if (!order) {
      return res.status(404).json({
        errors: ['Order not found'],
        message: 'No has order',
        data: null,
      });
    }

    const formattedOrder = order.map((order) => ({
      productId: order.Product.productId,
      title: order.Product.title,
      location: order.Product.location,
      status: order.orderStatus,
      orderId: order.orderId,
      orderApproveDate: order.createdAt,
      messageReview: order.Review ? order.Review.messageReview : undefined,
      rating: order.Review ? order.Review.rating : undefined,
      reviewCreatedAt: order.Review ? order.Review.createdAt : undefined,
    }));

    const sortedOrders = formattedOrder.sort((a, b) => {
      return new Date(b.orderApproveDate) - new Date(a.orderApproveDate);
    });

    return res.status(200).json({
      errors: [],
      message: 'Get Order Success',
      data: sortedOrders,
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
      order: [['createdAt', 'DESC']],
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

    const sortedOrders = formattedOrder.sort((a, b) => {
      return new Date(b.orderApproveDate) - new Date(a.orderApproveDate);
    });

    return res.status(200).json({
      errors: [],
      message: 'Get Order Success',
      data: sortedOrders,
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
      attributes: ['orderId', 'productId', 'userId', 'createdAt'],
      where: {
        orderId: order_id,
      },
      include: [
        {
          model: Product,
          attributes: ['title'],
        },
        {
          model: User,
          attributes: ['name', 'country'],
        }
      ]
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
        },
      }
    );

    if (result[0] == 0) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Order not found, already canceled, or on journey'],
        message: 'Cancel Order Failed',
        data: null,
      });
    }

    const orderCancel = {
      name: order.User.name,
      country: order.User.country,
      title: order.Product.title,
      orderId: order_id,
      orderApproveDate: order.createdAt,
    };

    let sendPaymentMails = [];
    for (const adminEmail of adminEmails) {
      const sendPaymentMail = sendOrderCancelToAdmin(
        adminEmail,
        orderCancel
      ); // Menghapus await di sini agar pengiriman email dilakukan secara paralel
      sendPaymentMails.push(sendPaymentMail); // Menambahkan promise ke array
    }

    // Menunggu semua email terkirim atau gagal
    const results = await Promise.all(sendPaymentMails);

    // Memeriksa apakah setidaknya satu email gagal terkirim
    if (results.some((result) => !result)) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Email order cancelation failed to send to Admin'],
        message: 'Cancel order Failed',
        data: null,
      });
    }
    
    await t.commit();

    return res.status(200).json({
      errors: [],
      message: 'Cancel Order Success and Send Email to Admin',
      data: null,
    });
  } catch (error) {
    next(
      new Error('controllers/orderController.js:cancelOrder - ' + error.message)
    );
  }
};

export { getAllOrder, getAllOrderAdmin, cancelOrder };
