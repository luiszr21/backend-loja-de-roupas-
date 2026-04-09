import { Router } from 'express'
import { criarProposta, minhasPropostas, listarPropostas, responderProposta } from '../controllers/proposta.controller'
import { autenticarCliente, autenticarAdmin } from '../middlewares/auth.middleware'

const router = Router()

router.post('/', autenticarCliente, criarProposta)
router.get('/minhas', autenticarCliente, minhasPropostas)
router.get('/', autenticarAdmin, listarPropostas)
router.patch('/:id', autenticarAdmin, responderProposta)

export default router