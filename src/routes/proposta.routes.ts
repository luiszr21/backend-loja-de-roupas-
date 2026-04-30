import { Router } from 'express'
import { criarProposta, minhasPropostas, listarPropostas, responderProposta } from '../controllers/proposta.controller'
import { autenticarCliente, autenticarAdmin } from '../middlewares/auth.middleware'

const router = Router()

// Rotas de cliente
router.post('/', autenticarCliente, criarProposta)
router.get('/minhas', autenticarCliente, minhasPropostas)

// Rotas de admin
router.patch('/:id', autenticarAdmin, responderProposta)
router.get('/', autenticarAdmin, listarPropostas)

export default router