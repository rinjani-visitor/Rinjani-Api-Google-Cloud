import sequelize from '../utils/db.js';
import { Sequelize } from 'sequelize';
import User from './userModel.js';
import Product from './productModel.js';

const Favorites = sequelize.define(
  'Favorites',
  {
    favoriteId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: Sequelize.UUID,
      references: {
        model: User,
        key: 'user_id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    },
    productId: {
      type: Sequelize.UUID,
      references: {
        model: Product,
        key: 'product_id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    },
  },
  {
    tableName: 'favorites',
    underscored: true,
    timestamps: true,
  }
);

sequelize.sync();

export default Favorites;
