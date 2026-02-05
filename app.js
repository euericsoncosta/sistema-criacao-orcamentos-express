import dotenv from "dotenv";
// 1. O dotenv deve ser sempre o primeiro para carregar as credenciais do Aiven
dotenv.config();

// 2. Importamos a instância do banco (que já executa o init no constructor)
import db from "./src/database/index.js"; 

import express from "express";
import methodOverride from "method-override";
import { resolve } from "path";
import { engine } from "express-handlebars";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");

// Importação das rotas
import homeRoutes from "./src/routes/homeRoutes.js";
import budgetRoutes from "./src/routes/budgetRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";

/**
 * AGUARDAR CONEXÃO (Top-Level Await)
 * Bloqueia a execução deste módulo até que o banco responda com sucesso.
 * Isso garante que 'export default app' só aconteça com o banco pronto.
 */
try {
  if (db && db.connection) {
    await db.connection.authenticate();
    console.log("✅ Servidor aguardou e confirmou conexão com Aiven.");
  }
} catch (error) {
  console.error("❌ A aplicação não pôde iniciar devido a falha no banco:", error.message);
  // Em ambientes serverless, não encerramos o processo, mas o erro será logado
}

/**
 * Classe principal da aplicação
 */
class App {
  constructor() {
    this.app = express();
    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.app.engine(
      "handlebars",
      engine({
        helpers: {
          formatCurrency: (value) => {
            return new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(value || 0);
          },
          formatDate: (date) => {
            if (!date) return "";
            const adjustedDate = new Date(date);
            adjustedDate.setMinutes(adjustedDate.getMinutes() + adjustedDate.getTimezoneOffset());
            return adjustedDate.toLocaleDateString("pt-BR");
          },
          eq: (v1, v2) => v1 === v2,
        },
        defaultLayout: "main",
      })
    );
    this.app.set("view engine", "handlebars");
    this.app.set("views", resolve(__dirname, "src", "views"));

    this.app.use(express.static(resolve(__dirname, "public")));
    this.app.use(methodOverride("_method"));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  routes() {
    this.app.use("/", homeRoutes);
    this.app.use("/budgets", budgetRoutes);
    this.app.use("/products", productRoutes);
  }
}

// Exporta a instância pronta
const myApp = new App().app;
export default myApp;