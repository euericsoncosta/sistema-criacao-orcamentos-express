import express from "express";
import ProductController from "../controllers/ProductController.js";

const router = express.Router();

/**
 * Rotas para Gestão do Catálogo (Produtos e Serviços)
 */

// Listagem de todos os produtos e serviços
router.get("/", ProductController.index);

// Renderiza o formulário de cadastro de novo produto/serviço
router.get("/new", ProductController.create);

// Processa o envio do formulário e guarda no banco de dados
router.post("/save", ProductController.store);

// Elimina um item do catálogo
// Nota: Usamos GET para facilitar o uso com links simples (confirm() no navegador)
router.get("/delete/:id", ProductController.delete);

export default router;
