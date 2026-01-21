import Budget from "../models/Budget.js";

/**
 * HomeController - Gerencia a lógica do Dashboard seguindo o padrão de Classe
 */
class HomeController {
  /**
   * GET /
   * Renderiza a página inicial com estatísticas resumidas e orçamentos recentes.
   */
  async index(req, res) {
    try {
      // 1. Busca todos os orçamentos ordenados do mais recente para o mais antigo
      // Usamos raw: true para facilitar a leitura no Handlebars
      const budgets = await Budget.findAll({
        order: [["created_at", "DESC"]],
        raw: true,
      });

      // 2. Processamento de Estatísticas para o Dashboard
      const stats = {
        totalCount: budgets.length,
        pendingCount: budgets.filter((b) => b.status === "Pending").length,
        approvedCount: budgets.filter((b) => b.status === "Approved").length,
        rejectedCount: budgets.filter((b) => b.status === "Rejected").length,

        // Calcula o valor total financeiro
        totalValue: budgets.reduce(
          (acc, curr) => acc + parseFloat(curr.totalAmount || 0),
          0,
        ),
      };

      // 3. Seleciona apenas os 5 orçamentos mais recentes para a tabela resumida
      const recentBudgets = budgets.slice(0, 5);

      // 4. Renderiza a view 'home'
      res.render("home", {
        title: "Dashboard | BudgetMaster",
        stats,
        recentBudgets,
      });
    } catch (error) {
      console.error("Erro ao carregar o dashboard:", error);

      res.status(500).render("error", {
        message: "Ocorreu um erro ao carregar as informações do sistema.",
        error: process.env.NODE_ENV === "development" ? error : {},
      });
    }
  }
}

// Exporta uma nova instância da classe (Padrão Singleton para Controllers)
export default new HomeController();
