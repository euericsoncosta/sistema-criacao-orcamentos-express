import Budget from "../models/Budget.js";
import BudgetItem from "../models/BudgetItem.js";
import Product from "../models/Product.js";

/**
 * BudgetController - Gestor central do módulo de Orçamentos.
 * Ajustado para compatibilidade com Aiven (SSL) e Sequelize (Underscored).
 */
class BudgetController {
  
  /**
   * INDEX: Lista todos os orçamentos.
   */
  async index(req, res) {
    try {
      // Proteção contra falha de inicialização do modelo
      if (!Budget.sequelize) throw new Error("Conexão com o banco de dados não detectada.");

      const budgets = await Budget.findAll({
        order: [["created_at", "DESC"]],
        raw: true,
      });

      res.render("budgets/index", {
        budgets: budgets || [],
        title: "Gestão de Orçamentos | BudgetMaster",
      });
    } catch (error) {
      console.error("Erro ao procurar orçamentos:", error);
      res.status(500).render("error", {
        message: "Não foi possível carregar a listagem de orçamentos. Verifique a conexão com o banco.",
      });
    }
  }

  /**
   * CREATE: Exibe o formulário de criação.
   */
  async create(req, res) {
    try {
      const products = await Product.findAll({
        order: [["name", "ASC"]],
        raw: true,
      });

      res.render("budgets/create", {
        title: "Novo Orçamento",
        products: products || [],
        today: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Erro ao carregar catálogo:", error);
      res.status(500).render("error", {
        message: "Erro ao acessar o catálogo de produtos.",
      });
    }
  }

  /**
   * STORE: Guarda um novo orçamento e os seus itens.
   */
  async store(req, res) {
    const {
      customerName,
      customerEmail,
      issueDate,
      expiryDays,
      notes,
      items,
      totalAmount,
    } = req.body;

    try {
      // Cálculo automático da data de expiração
      const date = new Date(issueDate);
      date.setDate(date.getDate() + parseInt(expiryDays || 15));
      const expiryDate = date.toISOString().split("T")[0];

      // Criação do Orçamento (Pai)
      const budget = await Budget.create({
        customerName,
        customerEmail,
        issueDate,
        expiryDate,
        totalAmount: parseFloat(totalAmount || 0),
        notes,
        status: "Pending",
      });

      // Criação dos Itens (Filhos) - Usando 'budget_id' por causa do underscored: true
      if (items && Array.isArray(items)) {
        const itemsToSave = items.map((item) => {
          const price = parseFloat(item.price || item.unitPrice || 0);
          const qty = parseInt(item.quantity || 0);
          return {
            budget_id: budget.id, // Campo correto para o banco
            description: item.description,
            quantity: qty,
            unitPrice: price,
            subtotal: qty * price,
          };
        });

        await BudgetItem.bulkCreate(itemsToSave);
      }

      res.redirect("/budgets");
    } catch (error) {
      console.error("Erro ao guardar orçamento:", error);
      res.status(400).render("error", {
        message: "Erro ao processar a gravação do orçamento. Verifique os dados inseridos.",
      });
    }
  }

  /**
   * EDIT: Prepara o formulário de edição.
   */
  async edit(req, res) {
    const { id } = req.params;
    try {
      const budgetInstance = await Budget.findByPk(id, {
        include: [{ model: BudgetItem, as: "items" }],
      });

      if (!budgetInstance) {
        return res.status(404).render("error", { message: "Orçamento não encontrado." });
      }

      const products = await Product.findAll({ order: [["name", "ASC"]], raw: true });
      const budget = budgetInstance.get({ plain: true });

      res.render("budgets/edit", {
        budget,
        items: budget.items || [],
        products: products || [],
        title: `Editar Orçamento #${id}`,
      });
    } catch (error) {
      console.error("Erro ao carregar edição:", error);
      res.status(500).render("error", { message: "Erro ao carregar dados de edição." });
    }
  }

  /**
   * UPDATE: Atualiza os dados e sincroniza os itens.
   */
  async update(req, res) {
    const { id } = req.params;
    const {
      customerName,
      customerEmail,
      issueDate,
      expiryDays,
      status,
      notes,
      items,
      totalAmount,
    } = req.body;

    try {
      const budget = await Budget.findByPk(id);
      if (!budget) return res.status(404).render("error", { message: "Orçamento inexistente." });

      const date = new Date(issueDate || budget.issueDate);
      date.setDate(date.getDate() + parseInt(expiryDays || 15));
      const expiryDate = date.toISOString().split("T")[0];

      await budget.update({
        customerName,
        customerEmail,
        issueDate,
        expiryDate,
        status,
        totalAmount: parseFloat(totalAmount || 0),
        notes,
      });

      // Sincronização: Remove antigos e insere novos (budget_id)
      await BudgetItem.destroy({ where: { budget_id: id } });

      if (items && Array.isArray(items)) {
        const itemsToSave = items.map((item) => {
          const price = parseFloat(item.price || item.unitPrice || 0);
          const qty = parseInt(item.quantity || 0);
          return {
            budget_id: id,
            description: item.description,
            quantity: qty,
            unitPrice: price,
            subtotal: qty * price,
          };
        });

        await BudgetItem.bulkCreate(itemsToSave);
      }

      res.redirect("/budgets");
    } catch (error) {
      console.error("Erro ao atualizar orçamento:", error);
      res.status(400).render("error", { message: "Falha na atualização do orçamento." });
    }
  }

  /**
   * SHOW: Visualização detalhada.
   */
  async show(req, res) {
    const { id } = req.params;
    try {
      const budgetInstance = await Budget.findByPk(id, {
        include: [{ model: BudgetItem, as: "items" }],
      });

      if (!budgetInstance) {
        return res.status(404).render("error", { message: "Orçamento não encontrado." });
      }

      const budget = budgetInstance.get({ plain: true });

      res.render("budgets/view", {
        budget,
        items: budget.items || [],
        title: `Visualizar Orçamento #${id}`,
      });
    } catch (error) {
      console.error("Erro ao visualizar:", error);
      res.status(500).render("error", { message: "Erro ao gerar visualização." });
    }
  }

  /**
   * DELETE: Remove o orçamento.
   */
  async delete(req, res) {
    const { id } = req.params;
    try {
      const budget = await Budget.findByPk(id);
      if (!budget) return res.status(404).render("error", { message: "Registro não encontrado." });

      await budget.destroy();
      res.redirect("/budgets");
    } catch (error) {
      console.error("Erro ao eliminar:", error);
      res.status(500).render("error", { message: "Erro ao eliminar o registro." });
    }
  }
}

export default new BudgetController();