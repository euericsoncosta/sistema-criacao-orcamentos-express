import Product from "../models/Product.js";

/**
 * ProductController - Gerencia o cadastro de Produtos e Serviços.
 * Ajustado para estabilidade na Vercel e tratamento de erros robusto.
 */
class ProductController {
  
  /**
   * INDEX: Listagem de todos os produtos e serviços.
   */
  async index(req, res) {
    try {
      // Proteção contra falha de inicialização (Comum na Vercel com Aiven)
      if (!Product.sequelize) {
        throw new Error("O sistema ainda não estabeleceu conexão com o banco de dados.");
      }

      const products = await Product.findAll({ 
        order: [['name', 'ASC']],
        raw: true 
      });

      res.render("products/index", { 
        products: products || [], 
        title: "Catálogo de Produtos e Serviços | BudgetMaster" 
      });
    } catch (error) {
      console.error("Erro ao listar produtos:", error);
      res.status(500).render("error", {
        message: "Não foi possível carregar o catálogo de produtos no momento.",
        error: error.message
      });
    }
  }

  /**
   * CREATE: Renderiza o formulário de cadastro.
   */
  async create(req, res) {
    try {
      res.render("products/new", { 
        title: "Cadastrar Novo Item | BudgetMaster" 
      });
    } catch (error) {
      res.status(500).render("error", { message: "Erro ao abrir formulário de cadastro." });
    }
  }

  /**
   * STORE: Salva o novo produto ou serviço no banco de dados.
   */
  async store(req, res) {
    try {
      const { name, itemType, basePrice } = req.body;

      // Validação simples
      if (!name || !basePrice) {
        return res.status(400).render("error", { message: "Nome e Preço Base são obrigatórios." });
      }

      await Product.create({ 
        name, 
        itemType: itemType || 'Product', 
        basePrice: parseFloat(basePrice) 
      });

      res.redirect("/products");
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      res.status(400).render("error", {
        message: "Falha ao gravar o produto. Verifique se os dados estão corretos.",
        error: error.message
      });
    }
  }

  /**
   * DELETE: Remove um item do catálogo pelo ID.
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).render("error", { message: "Produto não encontrado para exclusão." });
      }

      await product.destroy();
      res.redirect("/products");
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      res.status(500).render("error", {
        message: "Não foi possível remover o item. Ele pode estar sendo usado em algum orçamento.",
        error: error.message
      });
    }
  }
}

export default new ProductController();