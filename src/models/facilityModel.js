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

sequelize.sync();

Product.hasMany(Facility, {
  foreignKey: 'productId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});

Facility.belongsTo(Facility, {
  foreignKey: 'productId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});

export default Facility;
