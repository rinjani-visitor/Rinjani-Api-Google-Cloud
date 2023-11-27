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
  },
  {
    tableName: 'favorites',
    underscored: true,
    timestamps: true,
  }
);

Product.hasMany(Favorites, {
  foreignKey: 'productId',
  onDelete: 'CASCADE',
  onUpdate: 'RESTRICT',
});

Favorites.belongsTo(Product, {
  foreignKey: 'productId',
  onDelete: 'CASCADE',
  onUpdate: 'RESTRICT',
});

User.hasMany(Favorites, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  onUpdate: 'RESTRICT',
});

Favorites.belongsTo(User, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  onUpdate: 'RESTRICT',
});

sequelize.sync();

export default Favorites;
