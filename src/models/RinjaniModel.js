import sequelize from '../utils/db.js';
import { Sequelize } from 'sequelize';
import Product from './productModel.js';

const Rinjani = sequelize.define(
  'Rinjani',
  {
    rinjaniId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    description: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    duration: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    program: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    porter: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    guide: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    note: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'rinjani',
    underscored: true,
    timestamps: false,
  }
);

Product.hasOne(Rinjani, {
  foreignKey: 'productId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
})

Rinjani.belongsTo(Product, {
  foreignKey: 'productId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
})

sequelize.sync();

export default Rinjani;
