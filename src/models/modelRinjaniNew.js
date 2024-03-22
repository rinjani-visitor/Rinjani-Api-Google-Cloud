import sequelize from '../utils/db.js';
import { Sequelize } from 'sequelize';
import Product from './productModel.js';

const ModelRinjani = sequelize.define(
  'ModelRinjani',
  {
    rinjaniId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    duration: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    program: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    note: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'modelRinjani',
    underscored: true,
    timestamps: false,
  }
);

Product.hasOne(ModelRinjani, {
  foreignKey: 'productId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

ModelRinjani.belongsTo(Product, {
  foreignKey: 'productId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

sequelize.sync();

export default ModelRinjani;
