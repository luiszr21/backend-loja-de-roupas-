import { Router } from 'express'
import { cadastroCliente, loginCliente, loginAdmin } from '../controllers/auth.controller'

const router = Router()

router.post('/cadastro', cadastroCliente)
router.post('/login', loginCliente)
router.post('/admin/login', loginAdmin)

export default router