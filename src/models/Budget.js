import Sequelize, { Model } from "sequelize";

export default class Budget extends Model {
  static init(sequelize) {
    super.init(
      {
        customerName: {
          type: Sequelize.STRING,
          allowNull: false,
          field: "customer_name",
        },
        customerEmail: {
          type: Sequelize.STRING,
          field: "customer_email",
        },
        issueDate: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          field: "issue_date",
        },
        expiryDate: {
          type: Sequelize.DATEONLY,
          field: "expiry_date",
        },
        status: {
          type: Sequelize.ENUM("Pending", "Approved", "Rejected"),
          defaultValue: "Pending",
        },
        totalAmount: {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 0.0,
          field: "total_amount",
        },
        notes: {
          type: Sequelize.TEXT,
        },
      },
      {
        sequelize,
        tableName: "budgets",
        modelName: "Budget",
        underscored: true,
        timestamps: true,
      },
    );

    return this;
  }

  static associate(models) {
    this.hasMany(models.BudgetItem, {
      foreignKey: "budget_id",
      as: "items",
    });
  }
}
