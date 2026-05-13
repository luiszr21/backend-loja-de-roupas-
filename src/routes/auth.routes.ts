import { Router } from 'express'
import { cadastroCliente, loginCliente, loginAdmin, me, logout, criarAdmin } from '../controllers/auth.controller'
import { autenticarUsuario, autenticarAdmin } from '../middlewares/auth.middleware'

const router = Router()

router.post('/cadastro', cadastroCliente)
router.post('/login', loginCliente)
router.post('/admin/login', loginAdmin)
router.get('/me', autenticarUsuario, me)
router.post('/logout', autenticarUsuario, logout)
router.post('/criar-admin', autenticarAdmin, criarAdmin)

export default router