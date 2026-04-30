import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'
import { cadastroSchema, loginSchema } from '../schemas/auth.schema'

// ==================== HELPERS ====================

const gerarToken = (id: string, tipo: 'cliente' | 'admin') => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET não definido')
  }

  return jwt.sign(
    { id, tipo },
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
  const entidade = model === 'admin' 
    ? await prisma.admin.findUnique({ where: { email } })
    : await prisma.usuario.findUnique({ where: { email } })

  if (!entidade || !entidade.senha) return null

  const senhaCorreta = await bcrypt.compare(senha, entidade.senha)
  if (!senhaCorreta) return null

  return entidade
}

// ==================== CADASTRO ====================

export const cadastroCliente = async (req: Request, res: Response) => {
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
        erro: 'Email já cadastrado'
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
    return res.status(400).json({
      erros: validacao.error.flatten().fieldErrors
    })
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

    return res.json({
      token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: 'cliente'
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
    return res.status(400).json({
      erros: validacao.error.flatten().fieldErrors
    })
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