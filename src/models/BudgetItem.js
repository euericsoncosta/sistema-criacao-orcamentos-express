import Sequelize, { Model } from "sequelize";

export default class BudgetItem extends Model {
  static init(sequelize) {
    super.init(
      {
        budgetId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          field: "budget_id",
          references: {
            model: "budgets",
            key: "id",
          },
        },
        description: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        itemType: {
          type: Sequelize.ENUM("Product", "Service"),
          allowNull: false,
          field: "item_type",
        },
        quantity: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        unitPrice: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          field: "unit_price",
        },
        subtotal: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "budget_items",
        modelName: "BudgetItem",
        underscored: true,
        timestamps: true,
      },
    );

    return this;
  }

  static associate(models) {
    // Define a relação: Um Item pertence a um Orçamento (N:1)
    this.belongsTo(models.Budget, {
      foreignKey: "budget_id",
      as: "budget",
    });
  }
}
