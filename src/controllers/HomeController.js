import Budget from "../models/Budget.js";

/**
 * HomeController - Gerencia a lógica do Dashboard.
 * Versão de Alta Resiliência: Força o diagnóstico de conexão e mapeamento de dados.
 */
class HomeController {
  /**
   * GET /
   * Renderiza a página inicial com estatísticas.
   */
  async index(req, res) {
    try {
      /**
       * 1. VERIFICAÇÃO DE ESTADO DO MODELO (Obrigatório para Vercel)
       */
      const isInitialized = !!(Budget && Budget.sequelize);
      
      if (!isInitialized) {
        console.error("ERRO CRÍTICO: Modelo Budget sem instância do Sequelize.");
        throw new Error("O modelo de dados não foi inicializado. Verifique se o arquivo 'src/database/index.js' está sendo importado corretamente no topo do seu 'app.js'.");
      }

      /**
       * 2. TESTE DE CONEXÃO ATIVA (Autenticação no Aiven)
       */
      try {
        await Budget.sequelize.authenticate();
      } catch (authError) {
        console.error("ERRO DE AUTENTICAÇÃO AIVEN:", authError.message);
        throw new Error(`Falha ao conectar ao banco Aiven: ${authError.message}. Verifique o SSL e as credenciais.`);
      }

      /**
       * 3. BUSCA DE DADOS
       * Tentamos buscar os dados. Se retornar vazio, verificamos o motivo.
       */
      const budgets = await Budget.findAll({
        order: [["created_at", "DESC"]],
        raw: true,
      });

      // Se a conexão funciona mas não vem dados, pode ser um banco vazio ou erro de tabela
      const safeBudgets = budgets || [];

      /**
       * 4. PROCESSAMENTO DE ESTATÍSTICAS
       * Nota: Usamos curr.total_amount devido à configuração 'underscored: true'
       */
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

      // Log para debug no painel da Vercel
      console.log(`Dashboard carregado: ${safeBudgets.length} orçamentos encontrados.`);

      res.render("home", {
        title: "Dashboard | BudgetMaster",
        stats,
        recentBudgets,
        hasData: safeBudgets.length > 0
      });

    } catch (error) {
      console.error("Erro no HomeController:", error.message);
      res.status(500);
      
      res.render("error", {
        message: error.message,
        error: process.env.NODE_ENV === "development" ? error : {},
      }, (err, html) => {
        if (err) {
          // Fallback visual de emergência se a view 'error' sumir na Vercel
          return res.send(`
            <div style="font-family: sans-serif; padding: 50px; text-align: center; background: #fafafa;">
              <div style="max-width: 600px; margin: auto; background: #fff; padding: 30px; border-radius: 10px; border: 1px solid #ddd; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #e74c3c;">Erro de Dados</h1>
                <p style="color: #333; font-size: 1.1rem;">${error.message}</p>
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-left: 5px solid #e74c3c; text-align: left;">
                  <strong>Dica de Correção:</strong><br>
                  Certifique-se de que no seu <code>app.js</code>, a linha <code>import "./src/database/index.js"</code> 
                  está ANTES de qualquer rota. No Linux (Vercel), a ordem de importação é rígida.
                </div>
                <button onclick="window.location.reload()" style="margin-top: 20px; background: #3498db; color: #fff; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Recarregar Sistema</button>
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