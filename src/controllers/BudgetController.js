import Budget from "../models/Budget.js";
import BudgetItem from "../models/BudgetItem.js";
import Product from "../models/Product.js";

/**
 * BudgetController - Gerencia a lógica de orçamentos e itens
 */
class BudgetController {
  
  async index(req, res) {
    try {
      const budgets = await Budget.findAll({
        order: [["created_at", "DESC"]],
        raw: true,
      });

      res.render("budgets", {
        budgets,
        title: "Todos os Orçamentos | BudgetMaster",
      });
    } catch (error) {
      console.error("Erro ao buscar orçamentos:", error);
      res.status(500).render("error", { message: "Erro ao carregar a lista de orçamentos." });
    }
  }

  async create(req, res) {
    try {
      const products = await Product.findAll({
        order: [["name", "ASC"]],
        raw: true,
      });

      res.render("create-budget", {
        title: "Novo Orçamento",
        products,
        today: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Erro ao carregar formulário:", error);
      res.status(500).render("error", { message: "Erro ao carregar o catálogo." });
    }
  }

  async store(req, res) {
    // Garantir que req.body existe
    if (!req.body) {
        return res.status(400).render("error", { message: "Dados do formulário não recebidos." });
    }

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
      const date = new Date(issueDate);
      date.setDate(date.getDate() + parseInt(expiryDays || 15));
      const expiryDate = date.toISOString().split("T")[0];

      const budget = await Budget.create({
        customerName,
        customerEmail,
        issueDate,
        expiryDate,
        totalAmount: parseFloat(totalAmount || 0),
        notes,
        status: "Pending",
      });

      if (items && Array.isArray(items)) {
        const itemsWithBudgetId = items.map((item) => ({
          budgetId: budget.id,
          description: item.description,
          itemType: item.itemType,
          quantity: parseInt(item.quantity || 0),
          unitPrice: parseFloat(item.unitPrice || 0),
          subtotal: parseInt(item.quantity || 0) * parseFloat(item.unitPrice || 0),
        }));

        await BudgetItem.bulkCreate(itemsWithBudgetId);
      }

      res.redirect("/budgets");
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error);
      res.status(400).render("error", { message: "Erro ao salvar.", error: error.message });
    }
  }

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

      res.render("edit-budget", {
        budget,
        items: budget.items,
        products,
        title: `Editar Orçamento #${id}`,
      });
    } catch (error) {
      console.error("Erro ao carregar edição:", error);
      res.status(500).render("error", { message: "Erro ao carregar dados." });
    }
  }

  async update(req, res) {
    const { id } = req.params;

    // Proteção contra req.body undefined
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).render("error", { message: "Nenhum dado recebido para atualização." });
    }

    const {
      customerName,
      customerEmail,
      issueDate,
      expiryDays, // Usando expiryDays para recalcular se necessário
      status,
      notes,
      items,
      totalAmount,
    } = req.body;

    try {
      const budget = await Budget.findByPk(id);
      if (!budget) {
        return res.status(404).render("error", { message: "Orçamento não encontrado." });
      }

      // Recalcular data de expiração se houver nova data ou novos dias
      let expiryDate = req.body.expiryDate; 
      if (!expiryDate && expiryDays) {
          const date = new Date(issueDate || budget.issueDate);
          date.setDate(date.getDate() + parseInt(expiryDays));
          expiryDate = date.toISOString().split("T")[0];
      }

      await budget.update({
        customerName,
        customerEmail,
        issueDate,
        expiryDate: expiryDate || budget.expiryDate,
        status,
        totalAmount: parseFloat(totalAmount || 0),
        notes,
      });

      // Substituir itens
      await BudgetItem.destroy({ where: { budgetId: id } });

      if (items && Array.isArray(items)) {
        const itemsWithBudgetId = items.map((item) => ({
          budgetId: id,
          description: item.description,
          itemType: item.itemType,
          quantity: parseInt(item.quantity || 0),
          unitPrice: parseFloat(item.unitPrice || 0),
          subtotal: parseInt(item.quantity || 0) * parseFloat(item.unitPrice || 0),
        }));

        await BudgetItem.bulkCreate(itemsWithBudgetId);
      }

      res.redirect("/budgets");
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      res.status(400).render("error", { message: "Erro ao atualizar o orçamento." });
    }
  }

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

      res.render("quote-view", {
        budget,
        items: budget.items,
        title: `Orçamento #${id}`,
      });
    } catch (error) {
      console.error("Erro ao visualizar:", error);
      res.status(500).render("error", { message: "Erro ao carregar detalhes." });
    }
  }

  async delete(req, res) {
    const { id } = req.params;
    try {
      const budget = await Budget.findByPk(id);
      if (!budget) return res.status(404).json({ error: "Não encontrado." });

      await budget.destroy();
      res.redirect("/budgets");
    } catch (error) {
      console.error("Erro ao eliminar:", error);
      res.status(500).json({ error: "Erro ao eliminar." });
    }
  }
}

export default new BudgetController();