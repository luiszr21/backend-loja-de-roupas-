import { Router } from 'express'
import { criarProposta, minhasPropostas, listarPropostas, responderProposta } from '../controllers/proposta.controller'
import { autenticarCliente, autenticarAdmin } from '../middlewares/auth.middleware'

const router = Router()

// Rotas de cliente - ANTES das rotas de admin
router.post('/', autenticarCliente, criarProposta)
router.get('/minhas', autenticarCliente, minhasPropostas)
router.patch('/:id', autenticarAdmin, responderProposta)

// Rotas de admin - DEPOIS
router.get('/', autenticarAdmin, listarPropostas)

export default router