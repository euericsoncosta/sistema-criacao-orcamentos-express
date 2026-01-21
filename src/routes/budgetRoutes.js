import express from "express";
import BudgetController from "../controllers/BudgetController.js";

const router = express.Router();

/**
 * Rotas para a gestão de orçamentos
 */

// Listagem de todos os orçamentos (Página Principal do Módulo)
router.get("/", BudgetController.index);

// Renderizar o formulário de criação de novo orçamento
router.get("/new", BudgetController.create);

// Processar e guardar os dados do novo orçamento (POST)
router.post("/save", BudgetController.store);

// Visualizar os detalhes de um orçamento específico (e opção de imprimir)
router.get("/view/:id", BudgetController.show);

/** * Rota para eliminar orçamento
 * Nota: Definida como GET para funcionar com o window.location.href da sua View.
 * Se fosse uma API, o ideal seria o método DELETE.
 */
router.get("/delete/:id", BudgetController.delete);

// Rota de edição (Placeholder para implementação futura)
// router.get("/edit/:id", BudgetController.update);
router.get('/edit/:id', BudgetController.edit);   // GET para carregar o form
router.post('/update/:id', BudgetController.update); // POST para salvar

export default router;
