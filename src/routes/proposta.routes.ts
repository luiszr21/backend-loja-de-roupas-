import { Router } from 'express'
import {
	criarProposta,
	minhasPropostas,
	atualizarMinhaProposta,
	patchMinhaProposta,
	excluirMinhaProposta
} from '../controllers/proposta.controller'
import { autenticarCliente } from '../middlewares/auth.middleware'

const router = Router()

router.post('/', autenticarCliente, criarProposta)
router.get('/minhas', autenticarCliente, minhasPropostas)
router.put('/:id', autenticarCliente, atualizarMinhaProposta)
router.patch('/:id', autenticarCliente, patchMinhaProposta)
router.delete('/:id', autenticarCliente, excluirMinhaProposta)

export default router