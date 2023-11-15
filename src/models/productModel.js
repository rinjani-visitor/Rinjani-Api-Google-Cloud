import sequelize from '../utils/db.js';
import { Sequelize } from 'sequelize';
import Category from './categoryModel.js';
import SubCategory from './subCategoryModel.js';

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
    rating: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    location: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    lowestPrice: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    thumbnail: {
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

Category.hasMany(Product, {
  foreignKey: 'categoryId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});

Product.belongsTo(Category, {
  foreignKey: 'categoryId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});

SubCategory.hasMany(Product, {
  foreignKey: 'subCategoryId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});

Product.belongsTo(SubCategory, {
  foreignKey: 'subCategoryId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
})

sequelize.sync();

export default Product;
