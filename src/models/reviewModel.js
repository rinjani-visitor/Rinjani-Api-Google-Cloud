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
      type: Sequelize.TEXT,
      allowNull: false,
    },
    rating: {
      type: Sequelize.FLOAT,
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
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Review.belongsTo(Order, {
  foreignKey: 'orderId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})

Product.hasMany(Review, {
  foreignKey: 'productId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Review.belongsTo(Product, {
  foreignKey: 'productId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

User.hasMany(Review, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Review.belongsTo(User, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

sequelize.sync();

export default Review;
