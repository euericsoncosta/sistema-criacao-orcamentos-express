import Budget from "../models/Budget.js";

/**
 * HomeController - Gerencia a lógica do Dashboard.
 * Ajustado para evitar o erro 'Object.keys' em conexões instáveis.
 */
class HomeController {
  /**
   * GET /
   * Renderiza a página inicial com estatísticas resumidas.
   */
  async index(req, res) {
    try {
      // PROTEÇÃO CRÍTICA: Verifica se o Sequelize inicializou o modelo
      if (!Budget || !Budget.sequelize) {
        throw new Error("A conexão com o banco de dados Aiven ainda não foi estabelecida.");
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

        // Calcula o valor total (considerando underscored: true)
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

      // Se a view 'error' falhar, envia resposta em texto para não travar a Vercel
      try {
        res.status(500).render("error", {
          message: "Ocorreu um erro ao carregar as informações do sistema.",
          error: process.env.NODE_ENV === "development" ? error.message : "Erro de conexão com o banco.",
        });
      } catch (renderError) {
        res.status(500).send(`Erro crítico: ${error.message}`);
      }
    }
  }
}

export default new HomeController();