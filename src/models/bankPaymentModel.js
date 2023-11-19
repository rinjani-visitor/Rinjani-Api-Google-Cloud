import sequelize from '../utils/db.js';
import { Sequelize } from 'sequelize';
import Payment from './paymentModel.js';

const BankPayment = sequelize.define(
  'BankPayment',
  {
    bankPaymentId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    imageProofTransfer: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    bankName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    bankAccountName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    paymentId: {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: 'bankPayment',
    underscored: true,
    timestamps: true,
  }
);

Payment.hasOne(BankPayment, {
  foreignKey: 'paymentId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});

BankPayment.belongsTo(Payment, {
  foreignKey: 'paymentId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});

sequelize.sync();

export default BankPayment;
