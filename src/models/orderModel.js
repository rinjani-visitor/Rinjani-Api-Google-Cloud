import sequelize from '../utils/db.js';
import { Sequelize } from 'sequelize';
import Payment from './paymentModel.js';
import 'dotenv/config';
import User from './userModel.js';
import Product from './productModel.js';

const Order = sequelize.define(
  'Order',
  {
    orderId: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    orderStatus: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'On Journey',
    },
    paymentId: {
      type: Sequelize.UUID,
      primaryKey: true,
      unique: true,
      allowNull: false,
    },
  },
  {
    tableName: 'order',
    underscored: true,
    timestamps: true,
  }
);

Payment.hasOne(Order, {
  foreignKey: 'paymentId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});

Order.belongsTo(Payment, {
  foreignKey: 'paymentId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});

User.hasMany(Order, {
  foreignKey: 'userId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});

Order.belongsTo(User, {
  foreignKey: 'userId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
})

Product.hasMany(Order, {
  foreignKey: 'productId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});

Order.belongsTo(Product, {
  foreignKey: 'productId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});

sequelize.sync();

export default Order;
