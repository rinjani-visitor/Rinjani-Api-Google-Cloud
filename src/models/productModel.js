import sequelize from '../utils/db.js';
import { Sequelize } from 'sequelize';

const Product = sequelize.define(
    'Product',
    {
      productId: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'product',
      underscored: true,
      timestamps: true,
    }
  );
  
  sequelize.sync();
  
  export default Product;