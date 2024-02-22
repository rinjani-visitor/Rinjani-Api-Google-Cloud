import sequelize from '../utils/db.js';
import { Sequelize } from 'sequelize';
import Payment from './paymentModel.js';

const WisePayment = sequelize.define(
  'WisePayment',
  {
    wisePaymentId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    imageProofTransfer: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    wiseEmail: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: false,
      validate: {
        isEmail: true,
      },
      set(value) {
        this.setDataValue('wiseEmail', value.toLowerCase());
      },
    },
    wiseAccountName: {
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
    tableName: 'wisePayment',
    underscored: true,
    timestamps: true,
  }
);

Payment.hasOne(WisePayment, {
  foreignKey: 'paymentId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

WisePayment.belongsTo(Payment, {
  foreignKey: 'paymentId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

sequelize.sync();

export default WisePayment;
