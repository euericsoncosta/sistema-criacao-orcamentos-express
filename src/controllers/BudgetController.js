import Budget from "../models/Budget.js";
import BudgetItem from "../models/BudgetItem.js";
import Product from "../models/Product.js";

/**
 * BudgetController - Gestor central do módulo de Orçamentos.
 * Responsável por unir o catálogo de produtos à geração de propostas comerciais.
 */
class BudgetController {
  
  /**
   * INDEX: Lista todos os orçamentos.
   * Ordenados por data de criação (descendente).
   */
  async index(req, res) {
    try {
      const budgets = await Budget.findAll({
        order: [["created_at", "DESC"]],
        raw: true,
      });

      res.render("budgets/index", {
        budgets,
        title: "Gestão de Orçamentos | BudgetMaster",
      });
    } catch (error) {
      console.error("Erro ao procurar orçamentos:", error);
      res.status(500).render("error", {
        message: "Não foi possível carregar a listagem de orçamentos.",
      });
    }
  }

  /**
   * CREATE: Exibe o formulário de criação.
   * Carrega os produtos para seleção direta no catálogo.
   */
  async create(req, res) {
    try {
      const products = await Product.findAll({
        order: [["name", "ASC"]],
        raw: true,
      });

      res.render("budgets/create", {
        title: "Novo Orçamento",
        products,
        today: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Erro ao carregar catálogo:", error);
      res.status(500).render("error", {
        message: "Erro ao aceder ao catálogo de produtos.",
      });
    }
  }

  /**
   * STORE: Guarda um novo orçamento e os seus itens.
   */
  async store(req, res) {
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
        status: "Pending", // Status inicial padrão
      });

      // Criação dos Itens (Filhos)
      if (items && Array.isArray(items)) {
        const itemsToSave = items.map((item) => {
          const price = parseFloat(item.price || item.unitPrice || 0);
          const qty = parseInt(item.quantity || 0);
          return {
            budgetId: budget.id,
            description: item.description,
            itemType: item.itemType || "Product",
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
        message: "Erro ao processar a gravação do orçamento.",
      });
    }
  }

  /**
   * EDIT: Prepara o formulário de edição com os dados atuais.
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
        items: budget.items,
        products,
        title: `Editar Orçamento #${id}`,
      });
    } catch (error) {
      console.error("Erro ao carregar edição:", error);
      res.status(500).render("error", { message: "Erro ao carregar dados de edição." });
    }
  }

  /**
   * UPDATE: Atualiza os dados do orçamento e substitui os itens.
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

      // Recalcular validade com base na nova data ou dias informados
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

      // Lógica de Sincronização de Itens: Apaga os antigos e cria os novos
      await BudgetItem.destroy({ where: { budgetId: id } });

      if (items && Array.isArray(items)) {
        const itemsToSave = items.map((item) => {
          const price = parseFloat(item.price || item.unitPrice || 0);
          const qty = parseInt(item.quantity || 0);
          return {
            budgetId: id,
            description: item.description,
            itemType: item.itemType || "Product",
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
   * SHOW: Vista de visualização e impressão (PDF-ready).
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
        items: budget.items,
        title: `Visualizar Orçamento #${id}`,
      });
    } catch (error) {
      console.error("Erro ao visualizar:", error);
      res.status(500).render("error", { message: "Erro ao gerar visualização do orçamento." });
    }
  }

  /**
   * DELETE: Remove permanentemente um orçamento e itens associados.
   */
  async delete(req, res) {
    const { id } = req.params;
    try {
      const budget = await Budget.findByPk(id);
      if (!budget) return res.status(404).render("error", { message: "Registo não encontrado." });

      await budget.destroy();
      res.redirect("/budgets");
    } catch (error) {
      console.error("Erro ao eliminar:", error);
      res.status(500).render("error", { message: "Erro ao eliminar o registo." });
    }
  }
}

export default new BudgetController();