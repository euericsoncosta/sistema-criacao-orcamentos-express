import dotenv from "dotenv";
//configurando o dotenv
dotenv.config();

// Mova a importação do banco de dados para ser chamada dentro da classe
// import "./src/database/index.js"; // <-- REMOVA ESTA LINHA DAQUI

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
    this.database(); // <-- ADICIONE A CHAMADA PARA O MÉTODO DO BANCO DE DADOS
    this.middlewares();
    this.routes();
  }

  // CRIE UM NOVO MÉTODO PARA INICIALIZAR O BANCO DE DADOS
  database() {
    import("./src/database/index.js");
  }

  middlewares() {
    //configurando o engine de template handlebars
    // ... (o resto do seu método middlewares permanece o mesmo)
    this.app.engine(
      "handlebars",
      engine({
        helpers: {
          formatCurrency: (value) => {
            return new Intl.NumberFormat("pt-BR", { // Corrigido para pt-BR para o Real
              style: "currency",
              currency: "BRL",
            }).format(value || 0);
          },
          formatDate: (date) => {
            if (!date) return "";
            // Adicionado ajuste de fuso horário para evitar problemas com datas
            const adjustedDate = new Date(date);
            adjustedDate.setMinutes(adjustedDate.getMinutes() + adjustedDate.getTimezoneOffset());
            return adjustedDate.toLocaleDateString("pt-BR"); // Corrigido para pt-BR
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

export default new App().app;
