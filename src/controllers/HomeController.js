import Budget from "../models/Budget.js";

/**
 * HomeController - Gerencia a lógica do Dashboard.
 * Ajustado para prevenir o erro 'TypeError' na Vercel garantindo a conexão.
 */
class HomeController {
  /**
   * GET /
   * Renderiza a página inicial com estatísticas resumidas e orçamentos recentes.
   */
  async index(req, res) {
    try {
      /**
       * PROTEÇÃO DE INICIALIZAÇÃO (Vercel/Serverless):
       * O erro 'TypeError: Cannot convert undefined or null to object' no Sequelize
       * ocorre quando o modelo é chamado antes da instância do banco estar 100% pronta.
       */
      const isDatabaseReady = Budget && Budget.sequelize && typeof Budget.findAll === 'function';

      if (!isDatabaseReady) {
        console.error("Database Connection Status: Not Ready.");
        throw new Error("O sistema está a estabelecer a ligação com o banco de dados Aiven. Por favor, aguarde alguns segundos e atualize a página.");
      }

      // 1. Busca todos os orçamentos com tratamento de erro específico para a consulta
      const budgets = await Budget.findAll({
        order: [["created_at", "DESC"]],
        raw: true,
      }).catch(err => {
        console.error("Falha na consulta ao banco Aiven:", err.message);
        throw new Error("Não foi possível consultar os dados. Verifique se o banco Aiven está ativo e se o SSL está configurado corretamente.");
      });

      const safeBudgets = budgets || [];

      // 2. Processamento de Estatísticas para o Dashboard
      const stats = {
        totalCount: safeBudgets.length,
        pendingCount: safeBudgets.filter((b) => b.status === "Pending").length,
        approvedCount: safeBudgets.filter((b) => b.status === "Approved").length,
        rejectedCount: safeBudgets.filter((b) => b.status === "Rejected").length,

        // Cálculo financeiro (usando o padrão underscored: total_amount)
        totalValue: safeBudgets.reduce(
          (acc, curr) => acc + parseFloat(curr.total_amount || curr.totalAmount || 0),
          0,
        ),
      };

      // 3. Seleciona os 5 orçamentos mais recentes
      const recentBudgets = safeBudgets.slice(0, 5);

      // 4. Renderiza a view 'home'
      res.render("home", {
        title: "Dashboard | BudgetMaster",
        stats,
        recentBudgets,
      });

    } catch (error) {
      console.error("Erro detalhado no HomeController:", error.message);

      // Define o status de erro
      res.status(500);
      
      /**
       * RESILIÊNCIA DE VIEWS:
       * Se a Vercel não encontrar a view 'error', enviamos um fallback em HTML puro
       * para evitar o erro 'FUNCTION_INVOCATION_FAILED'.
       */
      res.render("error", {
        message: error.message,
        error: process.env.NODE_ENV === "development" ? error : {},
      }, (err, html) => {
        if (err) {
          // Fallback final: Resposta visual básica de erro
          return res.send(`
            <div style="font-family: sans-serif; padding: 40px; text-align: center; background: #fdfdfd; min-height: 100vh;">
              <div style="max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <h1 style="color: #e74c3c; margin-bottom: 10px;">Erro de Ligação</h1>
                <p style="color: #555; line-height: 1.6;">${error.message}</p>
                <p style="font-size: 0.85rem; color: #999; margin-top: 20px;">
                  Dica: Verifique se as Environment Variables (DATABASE_*) estão configuradas no painel da Vercel.
                </p>
                <button onclick="window.location.reload()" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-top: 20px;">
                  Tentar Novamente
                </button>
              </div>
            </div>
          `);
        }
        res.send(html);
      });
    }
  }
}

export default new HomeController();