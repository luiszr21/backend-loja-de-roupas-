import { Router } from 'express'
import {
  listarProdutos,
  listarDestaques,
  detalharProduto,
  cadastrarProduto,
  editarProduto,
  removerProduto
} from '../controllers/produto.controller'
import { autenticarAdmin } from '../middlewares/auth.middleware'

const router = Router()

// Rotas públicas — qualquer um acessa
router.get('/', listarProdutos)
router.get('/destaques', listarDestaques)
router.get('/:id', detalharProduto)

// Rotas protegidas — só admin
router.post('/', autenticarAdmin, cadastrarProduto)
router.put('/:id', autenticarAdmin, editarProduto)
router.delete('/:id', autenticarAdmin, removerProduto)

export default router