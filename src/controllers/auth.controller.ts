import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import prisma from '../lib/prisma'
import { cadastroSchema, loginSchema } from '../schemas/auth.schema'

type AuthUser = {
  id: string
  nome: string
  email: string
}

// ==================== HELPERS ====================

const gerarToken = (id: string, tipo: 'cliente' | 'admin') => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET não definido')
  }

  const jti = randomUUID()
  const role = tipo === 'cliente' ? 'user' : 'admin'

  return jwt.sign(
    { id, role, jti },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

const validarSenha = (senha: string): { valida: boolean; requisitos: { nome: string; atendido: boolean }[] } => {
  const requisitos = [
    {
      nome: 'Mínimo de 8 caracteres',
      atendido: senha.length >= 8
    },
    {
      nome: 'Pelo menos uma letra maiúscula',
      atendido: /[A-Z]/.test(senha)
    },
    {
      nome: 'Pelo menos um número',
      atendido: /[0-9]/.test(senha)
    },
    {
      nome: 'Pelo menos um caractere especial (!@#$%^&*)',
      atendido: /[^a-zA-Z0-9]/.test(senha)
    }
  ]

  const valida = requisitos.every(r => r.atendido)

  return { valida, requisitos }
}

const autenticar = async (
  model: 'usuario' | 'admin',
  email: string,
  senha: string
) => {
  try {
    const entidade = model === 'admin' 
      ? await prisma.admin.findUnique({ where: { email } })
      : await prisma.usuario.findUnique({ where: { email } })

    if (!entidade || !entidade.senha) return null

    const senhaCorreta = await bcrypt.compare(senha, entidade.senha)
    if (!senhaCorreta) return null

    return entidade
  } catch (error) {
    console.error('[ERRO] Falha na autenticação:', error)
    return null
  }
}

const encontrarAdminAutenticado = async (email: string, senha: string): Promise<(AuthUser & { origem: 'usuario' | 'admin' }) | null> => {
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true, nome: true, email: true, senha: true, isAdmin: true }
  })

  if (usuario?.isAdmin) {
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha)
    if (senhaCorreta) {
      return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        origem: 'usuario'
      }
    }
  }

  const admin = await prisma.admin.findUnique({
    where: { email },
    select: { id: true, nome: true, email: true, senha: true }
  })

  if (!admin) {
    return null
  }

  const senhaCorreta = await bcrypt.compare(senha, admin.senha)
  if (!senhaCorreta) {
    return null
  }

  return {
    id: admin.id,
    nome: admin.nome,
    email: admin.email,
    origem: 'admin'
  }
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
    const erros = validacao.error.flatten().fieldErrors
    
    return res.status(400).json({
      erros
    })
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
    console.error('[ERRO] Falha ao cadastrar usuário:', error)

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

    const token = gerarToken(usuario.id, 'cliente')

    return res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      .json({
        token,
        user: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          role: 'user',
          tipo: 'user'
        }
      })
  } catch (error) {
    console.error('[ERRO] Falha no login de cliente:', error)

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
    const admin = await encontrarAdminAutenticado(email, senha)

    if (!admin) {
      return res.status(401).json({
        erro: 'Email ou senha inválidos'
      })
    }

    if (admin.origem === 'usuario') {
      const usuario = await prisma.usuario.findUnique({
        where: { id: admin.id },
        select: { isAdmin: true }
      })

      if (!usuario?.isAdmin) {
        return res.status(403).json({
          erro: 'Apenas administradores podem acessar este painel'
        })
      }
    }

    const token = gerarToken(admin.id, 'admin')

    return res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      .json({
        token,
        user: {
          id: admin.id,
          nome: admin.nome,
          email: admin.email,
          role: 'admin',
          tipo: 'admin'
        }
      })
  } catch (error) {
    console.error('[ERRO] Falha no login de admin:', error)

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

      return res.json({ user: { ...usuario, role: 'user' as const, tipo: 'user' as const } })
    }

    const usuarioAdmin = await prisma.usuario.findUnique({
      where: { id: auth.id },
      select: { id: true, nome: true, email: true, isAdmin: true }
    })

    if (usuarioAdmin?.isAdmin) {
      return res.json({ user: { id: usuarioAdmin.id, nome: usuarioAdmin.nome, email: usuarioAdmin.email, role: 'admin' as const, tipo: 'admin' as const } })
    }

    const admin = await prisma.admin.findUnique({
      where: { id: auth.id },
      select: { id: true, nome: true, email: true }
    })

    if (!admin) {
      return res.status(404).json({ erro: 'Usuário não encontrado' })
    }

    return res.json({ user: { ...admin, role: 'admin' as const, tipo: 'admin' as const } })
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

// ==================== CRIAR ADMIN ====================

export const criarAdmin = async (req: Request, res: Response) => {
  const validacao = cadastroSchema.safeParse(req.body)

  if (!validacao.success) {
    const erros = validacao.error.flatten().fieldErrors
    
    // Se houver erro na senha, adicionar requisitos detalhados
    if (erros.senha && req.body.senha) {
      const validacaoSenha = validarSenha(req.body.senha)
      return res.status(400).json({
        erros,
        senhaRequisitos: validacaoSenha.requisitos
      })
    }

    return res.status(400).json({ erros })
  }

  const { nome, email, senha } = validacao.data

  try {
    const adminExiste = await prisma.admin.findUnique({
      where: { email }
    })

    if (adminExiste) {
      return res.status(409).json({
        erro: 'Email já cadastrado como administrador'
      })
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10)

    const admin = await prisma.admin.create({
      data: {
        nome,
        email,
        senha: senhaCriptografada
      }
    })

    return res.status(201).json({
      mensagem: 'Admin criado com sucesso',
      user: {
        id: admin.id,
        nome: admin.nome,
        email: admin.email,
        role: 'admin',
        tipo: 'admin'
      }
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      erro: 'Erro interno do servidor'
    })
  }
}