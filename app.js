import dotenv from "dotenv";
//configurando o dotenv
dotenv.config();
import "./src/database/index.js"; // Importando a conexão com o banco de dados

import express from "express";
import methodOverride from "method-override";
import { resolve } from "path";
import { engine } from "express-handlebars";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");


//importando as rotas
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
    //configurando o engine de template handlebars
    // Configura o Handlebars como motor de visualização
    this.app.engine(
      "handlebars",
      engine({
        helpers: {
          // Helper para formatar valores monetários (Ex: 1250.5 -> € 1.250,50)
          formatCurrency: (value) => {
            return new Intl.NumberFormat("pt-PT", {
              style: "currency",
              currency: "BRL",
            }).format(value || 0);
          },
          // Helper para formatar datas (Ex: 2023-10-27 -> 27/10/2023)
          formatDate: (date) => {
            if (!date) return "";
            return new Date(date).toLocaleDateString("pt-PT");
          },
          // Helper de comparação (essencial para os badges de status)
          eq: (v1, v2) => v1 === v2,
        },
        defaultLayout: "main",
      }),
    );
    this.app.set("view engine", "handlebars");
    this.app.set("views", resolve(__dirname, "src", "views"));

    //configurar pasta public
    this.app.use(express.static(resolve(__dirname, "public")));

    this.app.use(methodOverride("_method")); // Configura o método de substituição para permitir PUT e DELETE via POST

    // Configurando o express para aceitar JSON e URL-encoded
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  routes() {
    this.app.use("/", homeRoutes);
    this.app.use("/budgets", budgetRoutes);
    this.app.use("/products", productRoutes);
  }
}

export default new App().app;
