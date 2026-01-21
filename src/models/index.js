import { Sequelize } from "sequelize";
// Importamos o arquivo de configuração .cjs (CommonJS)
import dbConfig from "../config/database.cjs";
import budgetModel from "./Budget.js";
import budgetItemModel from "./BudgetItem.js";

// 1. Configuração da Conexão usando o arquivo da pasta config
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig,
);

const db = {};

// 2. Registro dos Modelos
db.Budget = budgetModel(sequelize);
db.BudgetItem = budgetItemModel(sequelize);

// 3. Ativação das Associações (Relacionamentos)
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
