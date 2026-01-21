import Sequelize, { Model } from "sequelize";

export default class Product extends Model {
  static init(sequelize) {
    super.init(
      {
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        itemType: {
          type: Sequelize.ENUM("Product", "Service"),
          allowNull: false,
          field: "item_type",
        },
        basePrice: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0.0,
          field: "base_price",
        },
      },
      {
        sequelize,
        tableName: "products",
        modelName: "Product",
        underscored: true,
        timestamps: true,
      },
    );

    return this;
  }
}
