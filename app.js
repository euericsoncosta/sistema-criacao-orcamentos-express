import dotenv from "dotenv";
dotenv.config();

// Importação síncrona para garantir que o banco esteja pronto antes das rotas
import "./src/database/index.js"; 

import express from "express";
import methodOverride from "method-override";
import { resolve } from "path";
import { engine } from "express-handlebars";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");

// Importando as rotas
import homeRoutes from "./src/routes/homeRoutes.js";
import budgetRoutes from "./src/routes/budgetRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";

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
          // Helper para formatar valores monetários (Padrão Real Brasileiro)
          formatCurrency: (value) => {
            return new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(value || 0);
          },
          // Helper para formatar datas corrigindo o fuso horário (UTC)
          formatDate: (date) => {
            if (!date) return "";
            const adjustedDate = new Date(date);
            // Ajuste para evitar que a data mude por causa do fuso horário do servidor
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

// Exporta apenas a instância do express
export default new App().app;