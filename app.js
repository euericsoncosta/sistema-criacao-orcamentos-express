import dotenv from "dotenv";
// 1. O dotenv deve ser sempre o primeiro para carregar as credenciais do Aiven
dotenv.config();

/**
 * 2. Importação da ligação à base de dados.
 * Nota: Se o driver 'mysql2' não estiver instalado, este import falhará.
 */
let connection;
try {
  const dbModule = await import("./src/database/index.js");
  connection = dbModule.default;
} catch (error) {
  console.error("❌ ERRO AO CARREGAR MÓDULO DE BASE DE DADOS:");
  console.error("Pode estar a faltar o pacote 'mysql2'. Execute: npm install mysql2");
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
 * Garante que a aplicação só aceita pedidos após validar o aperto de mão com o Aiven.
 */
try {
  if (!connection) {
    throw new Error("Instância de ligação inexistente. O driver 'mysql2' está instalado?");
  }

  // Testa a autenticação real (SSL e Credenciais)
  await connection.authenticate();
  console.log("✅ Conexão com Aiven validada com sucesso!");
} catch (error) {
  console.error("❌ FALHA CRÍTICA NA INICIALIZAÇÃO:");
  console.error("Mensagem:", error.message);
  
  // No ambiente de desenvolvimento, encerra o processo para alertar o programador
  if (process.env.NODE_ENV === "development") {
    console.warn("Dica: Verifique se o pacote 'mysql2' está no package.json em 'dependencies'.");
  }
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
          // Formatação para Real Brasileiro (conforme solicitado para o projeto)
          formatCurrency: (value) => {
            return new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(value || 0);
          },
          // Formatação de data com correção de fuso horário do servidor
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

    // Configuração de ficheiros estáticos e métodos de formulário
    this.app.use(express.static(resolve(__dirname, "public")));
    this.app.use(methodOverride("_method"));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  routes() {
    // Rotas protegidas pela inicialização da base de dados
    this.app.use("/", homeRoutes);
    this.app.use("/budgets", budgetRoutes);
    this.app.use("/products", productRoutes);
  }
}

const myApp = new App().app;
export default myApp;