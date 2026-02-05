import Budget from "../models/Budget.js";

/**
 * HomeController - Gerencia a lógica do Dashboard.
 * Versão resiliente para Vercel/Aiven, compatível com variáveis de ambiente ou config fixa.
 */
class HomeController {
  /**
   * GET /
   * Renderiza a página inicial com estatísticas e diagnósticos de banco.
   */
  async index(req, res) {
    try {
      /**
       * 1. VERIFICAÇÃO DE INICIALIZAÇÃO DO MODELO
       * O Sequelize injeta a propriedade 'sequelize' no modelo após o init().
       * Se estiver nulo, o arquivo src/database/index.js não foi executado ou falhou.
       */
      const isModelInitialized = !!(Budget && Budget.sequelize);

      if (!isModelInitialized) {
        // Diagnóstico para o log da Vercel
        console.error("DEBUG - Falha de Inicialização. Verifique se o Budget.init(connection) foi chamado.");
        
        throw new Error("O modelo 'Budget' não foi carregado. Certifique-se de que o banco de dados foi inicializado no seu arquivo de entrada (app.js ou server.js).");
      }

      /**
       * 2. TESTE DE CONEXÃO ATIVA (Autenticação no Aiven)
       * Tenta um 'ping' no banco. Se as credenciais estiverem erradas ou o SSL falhar, 
       * o erro será capturado aqui antes do crash 'Object.keys'.
       */
      await Budget.sequelize.authenticate().catch(err => {
        console.error("Erro de Autenticação no Aiven:", err.message);
        throw new Error("Não foi possível conectar ao banco Aiven. Verifique o SSL e as credenciais no arquivo de configuração. Detalhe: " + err.message);
      });

      // 3. Busca de Dados
      const budgets = await Budget.findAll({
        order: [["created_at", "DESC"]],
        raw: true,
      });

      const safeBudgets = budgets || [];

      // 4. Processamento de Estatísticas para o Dashboard
      const stats = {
        totalCount: safeBudgets.length,
        pendingCount: safeBudgets.filter((b) => b.status === "Pending").length,
        approvedCount: safeBudgets.filter((b) => b.status === "Approved").length,
        rejectedCount: safeBudgets.filter((b) => b.status === "Rejected").length,

        // Soma total (considerando underscored: true - campo total_amount no banco)
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
      console.error("Erro no HomeController:", error.message);
      
      res.status(500);
      
      /**
       * RESILIÊNCIA DE VIEWS:
       * Se a Vercel não encontrar a view 'error', enviamos um HTML básico de emergência.
       */
      res.render("error", {
        message: error.message,
        error: process.env.NODE_ENV === "development" ? error : {},
      }, (err, html) => {
        if (err) {
          // Fallback visual caso o arquivo error.handlebars não seja localizado
          return res.send(`
            <div style="font-family: sans-serif; padding: 40px; text-align: center; background: #fdfdfd; min-height: 100vh;">
              <div style="max-width: 600px; margin: auto; padding: 30px; border: 1px solid #ffcccc; background: #fff5f5; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <h2 style="color: #c0392b;">Erro de Ligação com o Banco</h2>
                <p style="color: #555; line-height: 1.5;">${error.message}</p>
                <div style="margin-top: 20px; text-align: left; background: #fff; padding: 15px; border: 1px solid #ddd; font-size: 0.9rem;">
                  <strong>Dica de Debug:</strong><br>
                  1. O erro de <code>avnadmin is not defined</code> foi resolvido (agora usa aspas).<br>
                  2. Verifique se o <strong>SSL</strong> está habilitado com <code>rejectUnauthorized: false</code>.<br>
                  3. Certifique-se de que o arquivo <code>src/database/index.js</code> está sendo importado no seu <code>app.js</code>.
                </div>
                <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">
                  Atualizar Página
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