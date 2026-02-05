import Budget from "../models/Budget.js";

/**
 * HomeController - Gerencia a lógica do Dashboard.
 * Ajustado para compatibilidade total com Vercel e Aiven.
 */
class HomeController {
  /**
   * GET /
   * Renderiza a página inicial com estatísticas resumidas.
   */
  async index(req, res) {
    try {
      // PROTEÇÃO CRÍTICA: Verifica se o Sequelize inicializou o modelo
      // Se Budget.sequelize for null, a conexão com o Aiven ainda não subiu
      if (!Budget || !Budget.sequelize) {
        throw new Error("O servidor ainda está estabelecendo conexão com o banco de dados Aiven. Por favor, atualize a página em instantes.");
      }

      // 1. Busca todos os orçamentos
      const budgets = await Budget.findAll({
        order: [["created_at", "DESC"]],
        raw: true,
      });

      const safeBudgets = budgets || [];

      // 2. Processamento de Estatísticas
      const stats = {
        totalCount: safeBudgets.length,
        pendingCount: safeBudgets.filter((b) => b.status === "Pending").length,
        approvedCount: safeBudgets.filter((b) => b.status === "Approved").length,
        rejectedCount: safeBudgets.filter((b) => b.status === "Rejected").length,

        // Como usamos 'underscored: true' no database.cjs, o campo no banco é 'total_amount'
        totalValue: safeBudgets.reduce(
          (acc, curr) => acc + parseFloat(curr.total_amount || curr.totalAmount || 0),
          0,
        ),
      };

      // 3. Seleciona os 5 mais recentes
      const recentBudgets = safeBudgets.slice(0, 5);

      // 4. Renderiza a view 'home'
      res.render("home", {
        title: "Dashboard | BudgetMaster",
        stats,
        recentBudgets,
      });

    } catch (error) {
      console.error("Erro detalhado ao carregar o dashboard:", error);

      // Tratamento de erro com fallback de segurança
      // Se a view 'error' não existir, enviamos uma resposta HTML básica para evitar o crash da Vercel
      res.status(500);
      
      res.render("error", {
        message: "Não foi possível carregar as informações do dashboard.",
        error: process.env.NODE_ENV === "development" ? error.message : "Erro na comunicação com o banco de dados.",
      }, (err, html) => {
        if (err) {
          // Se cair aqui, é porque o arquivo 'error.handlebars' não foi encontrado
          return res.send(`
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ff0000; border-radius: 8px;">
              <h1 style="color: #d9534f;">Erro no Sistema</h1>
              <p><strong>Motivo:</strong> ${error.message}</p>
              <p style="color: #666;">Nota: A página de erro personalizada (error.handlebars) não foi encontrada.</p>
              <a href="/" style="display: inline-block; margin-top: 10px; color: #0275d8;">Tentar novamente</a>
            </div>
          `);
        }
        res.send(html);
      });
    }
  }
}

export default new HomeController();