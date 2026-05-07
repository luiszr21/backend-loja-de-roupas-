import { Router } from 'express'
import { autenticarAdmin } from '../middlewares/auth.middleware'
import { listarPropostas, atualizarStatusPropostaAdmin } from '../controllers/proposta.controller'

const router = Router()

router.get('/propostas', autenticarAdmin, listarPropostas)
router.patch('/propostas/:id/status', autenticarAdmin, atualizarStatusPropostaAdmin)

export default router
