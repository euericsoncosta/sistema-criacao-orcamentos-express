import dotenv from "dotenv";
// 1. O dotenv deve ser sempre o primeiro para carregar as credenciais do Aiven
dotenv.config();

// 2. Importamos a instância do banco (que executa o init() de forma síncrona no constructor)
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
 * Este bloco garante que o Node.js pause a execução deste ficheiro até que
 * a ligação ao Aiven seja autenticada. Se falhar, a aplicação não "segue" para as rotas.
 */
try {
  if (!db || !db.connection) {
    throw new Error("A instância do banco de dados não foi localizada. Verifique o arquivo src/database/index.js.");
  }

  // Testa a comunicação real com o Aiven (Handshake SSL)
  await db.connection.authenticate();
  console.log("✅ Conexão com Aiven validada. Inicializando servidor...");
} catch (error) {
  console.error("❌ ERRO CRÍTICO NA INICIALIZAÇÃO:");
  console.error("Mensagem:", error.message);
  
  // Em desenvolvimento, encerramos o processo para forçar a correção das variáveis.
  // Na Vercel, o log ajudará a identificar se o problema é SSL ou Senha.
  if (process.env.NODE_ENV === "development") {
    process.exit(1); 
  }
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
          // Formatação para Real Brasileiro
          formatCurrency: (value) => {
            return new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(value || 0);
          },
          // Formatação de data corrigindo o fuso horário do servidor
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
    // Estas rotas só serão "ativas" se o Top-Level Await acima não lançar erro
    this.app.use("/", homeRoutes);
    this.app.use("/budgets", budgetRoutes);
    this.app.use("/products", productRoutes);
  }
}

// Exporta a instância configurada
const myApp = new App().app;
export default myApp;