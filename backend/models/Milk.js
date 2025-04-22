const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Milk = sequelize.define('milk', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customer_name: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'customer_name'
  },
  milk_type: {
    type: DataTypes.ENUM('morning', 'evening'),
    allowNull: false,
    field: 'milk_type'
  },
  liters: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  cash_received: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'cash_received'
  },
  credit_due: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'credit_due'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'milk',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['date']
    },
    {
      fields: ['user_id']
    }
  ]
});

module.exports = Milk; 