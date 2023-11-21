import sequelize from '../utils/db.js';
import { Sequelize } from 'sequelize';
import Product from './productModel.js';
import User from './userModel.js';
import Order from './orderModel.js';

const Review = sequelize.define(
  'Review',
  {
    reviewId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    messageReview: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    rating: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'review',
    underscored: true,
    timestamps: true,
  }
);

Order.hasOne(Review, {
  foreignKey: 'orderId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});

Review.belongsTo(Order, {
  foreignKey: 'orderId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
})

Product.hasMany(Review, {
  foreignKey: 'productId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});

Review.belongsTo(Product, {
  foreignKey: 'productId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});

User.hasMany(Review, {
  foreignKey: 'userId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});

Review.belongsTo(User, {
  foreignKey: 'userId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});

sequelize.sync();

export default Review;
