import dotenv from "dotenv";
// 1. O dotenv deve ser sempre o primeiro para carregar as credenciais do Aiven
dotenv.config();

/**
 * 2. Importação da ligação à base de dados.
 * No Render, o processo é persistente, o que torna a ligação mais estável.
 */
let connection;
try {
  const dbModule = await import("./src/database/index.js");
  connection = dbModule.default;
} catch (error) {
  console.error("❌ ERRO AO CARREGAR MÓDULO DE BASE DE DADOS:");
  console.error("Certifique-se de que o pacote 'mysql2' está nas dependencies do package.json.");
  console.error("Detalhe:", error.message);
}

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
 * No Render, isto garante que o serviço só fica "Live" (Verde) 
 * após a confirmação de que o banco Aiven aceitou a ligação.
 */
try {
  if (connection) {
    await connection.authenticate();
    console.log("✅ Conexão com Aiven validada. Web Service pronto!");
  }
} catch (error) {
  console.error("❌ FALHA CRÍTICA NA INICIALIZAÇÃO:");
  console.error("Mensagem:", error.message);
}

/**
 * Classe principal da aplicação (Padrão Singleton)
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
          // Formatação para Real Brasileiro
          formatCurrency: (value) => {
            return new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(value || 0);
          },
          // Formatação de data com correção de fuso horário
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

const myApp = new App().app;
export default myApp;