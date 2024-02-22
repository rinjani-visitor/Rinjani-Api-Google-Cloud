import sequelize from '../utils/db.js';
import { Sequelize } from 'sequelize';
import Product from './productModel.js';

const AddOnsModel = sequelize.define(
  'AddOnsModel',
  {
    addOnsId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    addOnsName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'addOnsModel',
    underscored: true,
    timestamps: false,
  }
);

Product.belongsToMany(AddOnsModel, {
  through: 'product_addons',
  foreignKey: 'productId',
  otherKey: 'addOnsId',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
  timestamps: false,
});

AddOnsModel.belongsToMany(Product, {
  through: 'product_addons',
  foreignKey: 'addOnsId',
  otherKey: 'productId',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
  timestamps: false,
});

sequelize.sync();

export default AddOnsModel;
