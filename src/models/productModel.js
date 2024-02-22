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
      defaultValue: 0,
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
      type: Sequelize.TEXT,
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
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Product.belongsTo(Category, {
  foreignKey: 'categoryId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

SubCategory.hasMany(Product, {
  foreignKey: 'subCategoryId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Product.belongsTo(SubCategory, {
  foreignKey: 'subCategoryId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})

sequelize.sync();

export default Product;
