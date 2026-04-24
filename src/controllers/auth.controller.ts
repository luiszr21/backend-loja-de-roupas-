import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import prisma from '../lib/prisma'
import { cadastroSchema, loginSchema } from '../schemas/auth.schema'

// ==================== HELPERS ====================

const gerarToken = (id: string, role: 'user' | 'admin') => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET não definido')
  }

  const jti = randomUUID()

  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d', jwtid: jti }
  )
}

const autenticar = async (
  model: 'usuario' | 'admin',
  email: string,
  senha: string
) => {
  const entidade = model === 'usuario'
    ? await prisma.usuario.findUnique({ where: { email } })
    : await prisma.admin.findUnique({ where: { email } })

  if (!entidade || !entidade.senha) return null

  const senhaCorreta = await bcrypt.compare(senha, entidade.senha)
  if (!senhaCorreta) return null

  return entidade
}

const formatarErrosValidacao = (fieldErrors: Record<string, string[] | undefined>) => {
  const campos: Record<string, string> = {}

  for (const [campo, erros] of Object.entries(fieldErrors)) {
    if (erros && erros.length > 0) {
      campos[campo] = erros[0]
    }
  }

  return {
    erro: 'Dados inválidos',
    campos
  }
}

// ==================== CADASTRO ====================

export const cadastroCliente = async (req: Request, res: Response) => {
  const validacao = cadastroSchema.safeParse(req.body)

  if (!validacao.success) {
    return res.status(400).json(
      formatarErrosValidacao(validacao.error.flatten().fieldErrors)
    )
  }

  const { nome, email, senha } = validacao.data

  try {
    const usuarioExiste = await prisma.usuario.findUnique({
      where: { email }
    })

    if (usuarioExiste) {
      return res.status(400).json({
        erro: 'Não foi possível concluir o cadastro com os dados informados'
      })
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10)

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaCriptografada
      }
    })

    return res.status(201).json({
      mensagem: 'Cadastro realizado com sucesso',
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      }
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      erro: 'Erro interno do servidor'
    })
  }
}

// ==================== LOGIN CLIENTE ====================

export const loginCliente = async (req: Request, res: Response) => {
  const validacao = loginSchema.safeParse(req.body)

  if (!validacao.success) {
    return res.status(400).json(
      formatarErrosValidacao(validacao.error.flatten().fieldErrors)
    )
  }

  const { email, senha } = validacao.data

  try {
    const usuario = await autenticar('usuario', email, senha)

    if (!usuario) {
      return res.status(401).json({
        erro: 'Email ou senha inválidos'
      })
    }

    const token = gerarToken(usuario.id, 'user')

    return res.json({
      token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: 'user'
      }
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      erro: 'Erro interno do servidor'
    })
  }
}

// ==================== LOGIN ADMIN ====================

export const loginAdmin = async (req: Request, res: Response) => {
  const validacao = loginSchema.safeParse(req.body)

  if (!validacao.success) {
    return res.status(400).json(
      formatarErrosValidacao(validacao.error.flatten().fieldErrors)
    )
  }

  const { email, senha } = validacao.data

  try {
    const admin = await autenticar('admin', email, senha)

    if (!admin) {
      return res.status(401).json({
        erro: 'Email ou senha inválidos'
      })
    }

    const token = gerarToken(admin.id, 'admin')

    return res.json({
      token,
      user: {
        id: admin.id,
        nome: admin.nome,
        email: admin.email,
        role: 'admin'
      }
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      erro: 'Erro interno do servidor'
    })
  }
}

export const me = async (req: Request, res: Response) => {
  const auth = res.locals.auth as { id: string, role: 'user' | 'admin', jti: string, exp: number } | undefined

  if (!auth) {
    return res.status(401).json({ erro: 'Token não fornecido' })
  }

  try {
    if (auth.role === 'user') {
      const usuario = await prisma.usuario.findUnique({
        where: { id: auth.id },
        select: { id: true, nome: true, email: true }
      })

      if (!usuario) {
        return res.status(404).json({ erro: 'Usuário não encontrado' })
      }

      return res.json({ user: { ...usuario, role: 'user' as const } })
    }

    const admin = await prisma.admin.findUnique({
      where: { id: auth.id },
      select: { id: true, nome: true, email: true }
    })

    if (!admin) {
      return res.status(404).json({ erro: 'Usuário não encontrado' })
    }

    return res.json({ user: { ...admin, role: 'admin' as const } })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      erro: 'Erro interno do servidor'
    })
  }
}

export const logout = async (_req: Request, res: Response) => {
  const auth = res.locals.auth as { id: string, role: 'user' | 'admin', jti: string, exp: number } | undefined

  if (!auth) {
    return res.status(401).json({ erro: 'Token não fornecido' })
  }

  try {
    await prisma.tokenRevogado.upsert({
      where: { jti: auth.jti },
      update: {},
      create: {
        jti: auth.jti,
        usuarioId: auth.id,
        role: auth.role,
        expiracao: new Date(auth.exp * 1000)
      }
    })

    return res.status(204).send()
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      erro: 'Erro interno do servidor'
    })
  }
}