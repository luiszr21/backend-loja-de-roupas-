import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma'
import { cadastroCliente, loginCliente, loginAdmin, me, logout } from '../controllers/auth.controller'
import { autenticarUsuario } from '../middlewares/auth.middleware'

const router = Router()

router.post('/cadastro', cadastroCliente)
router.post('/login', loginCliente)
router.post('/admin/login', loginAdmin)
router.get('/me', autenticarUsuario, me)
router.post('/logout', autenticarUsuario, logout)

router.post('/criar-admin', async (req: Request, res: Response) => {
  const { nome, email, senha } = req.body
  const senhaCriptografada = await bcrypt.hash(senha, 10)
  const admin = await prisma.admin.create({
    data: { nome, email, senha: senhaCriptografada }
  })
  return res.status(201).json(admin)
})

export default router