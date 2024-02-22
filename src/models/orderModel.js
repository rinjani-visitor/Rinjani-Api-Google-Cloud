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
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Order.belongsTo(Payment, {
  foreignKey: 'paymentId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

User.hasMany(Order, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Order.belongsTo(User, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})

Product.hasMany(Order, {
  foreignKey: 'productId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Order.belongsTo(Product, {
  foreignKey: 'productId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

sequelize.sync();

export default Order;
