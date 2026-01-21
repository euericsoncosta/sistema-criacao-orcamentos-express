import Product from "../models/Product.js";

/**
 * ProductController - Gerencia o cadastro de Produtos e Serviços
 */
class ProductController {
  // GET /products - Listagem
  async index(req, res) {
    try {
      const products = await Product.findAll({ raw: true });
      res.render("products/index", { products, title: "Produtos e Serviços" });
    } catch (error) {
      res.status(500).send("Erro ao listar produtos.");
    }
  }

  // GET /products/new - Formulário
  async create(req, res) {
    res.render("products/new", { title: "Cadastrar Item" });
  }

  // POST /products/save - Salvar
  async store(req, res) {
    try {
      const { name, itemType, basePrice } = req.body;
      await Product.create({ name, itemType, basePrice });
      res.redirect("/products");
    } catch (error) {
      res.status(400).send("Erro ao salvar produto.");
    }
  }

  // GET /products/delete/:id
  async delete(req, res) {
    try {
      await Product.destroy({ where: { id: req.params.id } });
      res.redirect("/products");
    } catch (error) {
      res.status(500).send("Erro ao deletar.");
    }
  }
}

export default new ProductController();
