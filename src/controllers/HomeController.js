import Budget from "../models/Budget.js";

class HomeController {
  async index(req, res) {
    try {
      // Verificação de segurança: Se o modelo não carregou, evita o crash
      if (!Budget || typeof Budget.findAll !== 'function') {
        throw new Error("O modelo Budget não foi inicializado corretamente.");
      }

      const budgets = await Budget.findAll({
        order: [["created_at", "DESC"]],
        raw: true,
      });

      // Se budgets for null ou undefined por erro de conexão, tratamos aqui
      const safeBudgets = budgets || [];

      const stats = {
        totalCount: safeBudgets.length,
        pendingCount: safeBudgets.filter((b) => b.status === "Pending").length,
        approvedCount: safeBudgets.filter((b) => b.status === "Approved").length,
        rejectedCount: safeBudgets.filter((b) => b.status === "Rejected").length,

        totalValue: safeBudgets.reduce(
          (acc, curr) => acc + parseFloat(curr.total_amount || curr.totalAmount || 0),
          0,
        ),
      };

      const recentBudgets = safeBudgets.slice(0, 5);

      res.render("home", {
        title: "Dashboard | BudgetMaster",
        stats,
        recentBudgets,
      });
    } catch (error) {
      console.error("Erro detalhado ao carregar o dashboard:", error);

      // Fallback: Se a view 'error' não existir (como o log indicou), enviamos JSON ou Texto
      try {
        res.status(500).render("error", {
          message: "Ocorreu um erro ao carregar as informações do sistema.",
          error: process.env.NODE_ENV === "development" ? error.message : {},
        });
      } catch (renderError) {
        res.status(500).send(`Erro interno no servidor: ${error.message}`);
      }
    }
  }
}

export default new HomeController();