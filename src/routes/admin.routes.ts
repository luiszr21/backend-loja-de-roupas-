import { Router } from 'express'
import {
	atualizarProdutoAdmin,
	criarProdutoAdmin,
	dashboardStats,
	enviarEmailInteracao,
	excluirInteracao,
	excluirProdutoAdmin,
	listarInteracoes,
	confirmarInteracao,
	responderInteracao
} from '../controllers/admin.controller'
import { autenticarAdmin } from '../middlewares/auth.middleware'

const router = Router()

router.use(autenticarAdmin)

router.get('/dashboard/stats', dashboardStats)

router.post('/produtos', criarProdutoAdmin)
router.put('/produtos/:id', atualizarProdutoAdmin)
router.delete('/produtos/:id', excluirProdutoAdmin)

router.get('/interacoes', listarInteracoes)
router.patch('/interacoes/:id/responder', responderInteracao)
router.patch('/interacoes/:id/confirmar', confirmarInteracao)
router.post('/interacoes/:id/enviar-email', enviarEmailInteracao)
router.delete('/interacoes/:id', excluirInteracao)

export default router
