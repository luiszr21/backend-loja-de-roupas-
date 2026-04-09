import { Request, Response } from 'express'
import prisma from '../lib/prisma'

// Cliente envia proposta
export const criarProposta = async (req: Request, res: Response) => {
  const usuarioId = req.headers['usuarioId'] as string
  const { produtoId, mensagem } = req.body

  if (!usuarioId) {
    return res.status(401).json({ erro: 'Usuário não autenticado' })
  }

  if (!produtoId || !mensagem) {
    return res.status(400).json({ erro: 'Produto e mensagem são obrigatórios' })
  }

  try {
    // Validar se o usuário existe
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' })
    }

    // Validar se o produto existe
    const produto = await prisma.produto.findUnique({ where: { id: produtoId } })
    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado' })
    }

    // Verificar se já existe proposta para o mesmo usuário e produto
    const propostaExistente = await prisma.proposta.findFirst({
      where: { usuarioId, produtoId }
    })
    if (propostaExistente) {
      return res.status(409).json({ erro: 'Você já fez uma proposta para este produto' })
    }

    const proposta = await prisma.proposta.create({
      data: { usuarioId, produtoId, mensagem, status: 'pendente' },
      include: { produto: true }
    })

    return res.status(201).json(proposta)
  } catch (erro) {
    console.error('Erro ao criar proposta:', erro)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

// Cliente vê suas propostas
export const minhasPropostas = async (req: Request, res: Response) => {
  const usuarioId = req.headers['usuarioId'] as string
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10

  if (!usuarioId) {
    return res.status(401).json({ erro: 'Usuário não autenticado' })
  }

  try {
    const skip = (page - 1) * limit

    // Contar total de propostas
    const total = await prisma.proposta.count({
      where: { usuarioId }
    })

    // Buscar propostas com paginação
    const propostas = await prisma.proposta.findMany({
      where: { usuarioId },
      include: { produto: true },
      orderBy: { criadoEm: 'desc' },
      skip,
      take: limit
    })

    return res.json({
      propostas,
      paginacao: {
        total,
        pagina: page,
        limite: limit,
        totalPaginas: Math.ceil(total / limit)
      }
    })
  } catch (erro) {
    console.error('Erro ao listar propostas:', erro)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

// Admin vê todas as propostas
export const listarPropostas = async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10

  try {
    const skip = (page - 1) * limit
    const where = status ? { status } : {}

    const total = await prisma.proposta.count({ where })

    const propostas = await prisma.proposta.findMany({
      where,
      include: {
        produto: true,
        usuario: { select: { id: true, nome: true, email: true } }
      },
      orderBy: { criadoEm: 'desc' },
      skip,
      take: limit
    })

    return res.json({
      propostas,
      paginacao: {
        total,
        pagina: page,
        limite: limit,
        totalPaginas: Math.ceil(total / limit)
      }
    })
  } catch (erro) {
    console.error('Erro ao listar propostas:', erro)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

// Admin responde uma proposta
export const responderProposta = async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const { resposta, status } = req.body

  if (!resposta) {
    return res.status(400).json({ erro: 'Resposta é obrigatória' })
  }

  const statusValidos = ['pendente', 'respondida', 'aceita', 'rejeitada']
  if (status && !statusValidos.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido' })
  }

  try {
    const proposta = await prisma.proposta.update({
      where: { id },
      data: {
        resposta,
        status: status || 'respondida'
      },
      include: {
        produto: true,
        usuario: { select: { id: true, nome: true, email: true } }
      }
    })

    return res.json(proposta)
  } catch (erro) {
    console.error('Erro ao responder proposta:', erro)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}