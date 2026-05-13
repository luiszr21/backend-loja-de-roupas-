import { Router } from 'express'
import {
	criarProposta,
	minhasPropostas,
	atualizarMinhaProposta,
	patchMinhaProposta,
	excluirMinhaProposta,
	atualizarStatusPropostaAdmin,
	listarPropostas
} from '../controllers/proposta.controller'
import { autenticarCliente, autenticarAdmin } from '../middlewares/auth.middleware'

const router = Router()

// Rotas de admin - ANTES (rotas genéricas sempre primeiro)
router.get('/', autenticarAdmin, listarPropostas)
router.patch('/:id/status', autenticarAdmin, atualizarStatusPropostaAdmin)

// Rotas de cliente - DEPOIS (rotas específicas depois)
router.post('/', autenticarCliente, criarProposta)
router.get('/minhas', autenticarCliente, minhasPropostas)
router.put('/:id', autenticarCliente, atualizarMinhaProposta)
router.patch('/:id', autenticarCliente, patchMinhaProposta)
router.delete('/:id', autenticarCliente, excluirMinhaProposta)

export default router