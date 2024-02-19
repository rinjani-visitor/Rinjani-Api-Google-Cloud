import sequelize from '../utils/db.js';
import { Sequelize } from 'sequelize';
import Product from './productModel.js';

const Facility = sequelize.define(
  'facility',
  {
    facilityId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    facilityName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'facility',
    underscored: true,
    timestamps: false,
  }
);

Product.belongsToMany(Facility, {
  through: 'product_facility',
  foreignKey: 'productId',
  otherKey: 'facilityId',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
  timestamps: false,
});

Facility.belongsToMany(Product, {
  through: 'product_facility',
  foreignKey: 'facilityId',
  otherKey: 'productId',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
  timestamps: false,
});

sequelize.sync();

export default Facility;
