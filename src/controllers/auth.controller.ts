import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'
import { cadastroSchema, loginSchema } from '../schemas/auth.schema'

// ==================== CADASTRO ====================
export const cadastroCliente = async (req: Request, res: Response) => {
  const validacao = cadastroSchema.safeParse(req.body)

  if (!validacao.success) {
    return res.status(400).json({ erros: validacao.error.flatten().fieldErrors })
  }

  const { nome, email, senha } = validacao.data

  try {
    const usuarioExiste = await prisma.usuario.findUnique({ where: { email } })
    if (usuarioExiste) return res.status(400).json({ erro: 'Email já cadastrado' })

    const senhaCriptografada = await bcrypt.hash(senha, 10)

    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: senhaCriptografada }
    })

    return res.status(201).json({ mensagem: 'Cadastro realizado!', id: usuario.id })
  } catch (error) {
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

// ==================== LOGIN CLIENTE ====================
export const loginCliente = async (req: Request, res: Response) => {
  const validacao = loginSchema.safeParse(req.body)

  if (!validacao.success) {
    return res.status(400).json({ erros: validacao.error.flatten().fieldErrors })
  }

  const { email, senha } = validacao.data

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } })
    if (!usuario) return res.status(401).json({ erro: 'Email ou senha inválidos' })

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha)
    if (!senhaCorreta) return res.status(401).json({ erro: 'Email ou senha inválidos' })

    const token = jwt.sign(
      { id: usuario.id, tipo: 'cliente' },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    return res.json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
    })
  } catch (error) {
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

// ==================== LOGIN ADMIN ====================
export const loginAdmin = async (req: Request, res: Response) => {
  const validacao = loginSchema.safeParse(req.body)

  if (!validacao.success) {
    return res.status(400).json({ erros: validacao.error.flatten().fieldErrors })
  }

  const { email, senha } = validacao.data

  try {
    const admin = await prisma.admin.findUnique({ where: { email } })
    if (!admin) return res.status(401).json({ erro: 'Email ou senha inválidos' })

    const senhaCorreta = await bcrypt.compare(senha, admin.senha)
    if (!senhaCorreta) return res.status(401).json({ erro: 'Email ou senha inválidos' })

    const token = jwt.sign(
      { id: admin.id, tipo: 'admin' },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    return res.json({
      token,
      admin: { id: admin.id, nome: admin.nome, email: admin.email }
    })
  } catch (error) {
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}