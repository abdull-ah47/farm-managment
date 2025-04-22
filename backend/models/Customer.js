const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('customer', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
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
    tableName: 'customers',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['name', 'user_id']
        }
    ]
});

module.exports = Customer; 