import sequelize from '../utils/db.js';
import { Sequelize } from 'sequelize';
import Product from './productModel.js';

const HomeStay = sequelize.define(
  'HomeStay',
  {
    homeStayId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    description: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    note: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'homestay',
    underscored: true,
    timestamps: false,
  }
);

Product.hasMany(HomeStay, {
  foreignKey: 'productId',
  onDelete: 'CASCADE',
  onUpdate: 'RESTRICT',
});

HomeStay.belongsTo(Product, {
  foreignKey: 'productId',
  onDelete: 'CASCADE',
  onUpdate: 'RESTRICT',
});

sequelize.sync();

export default HomeStay;
