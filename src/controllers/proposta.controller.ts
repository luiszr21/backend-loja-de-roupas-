import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import {
  criarPropostaSchema,
  atualizarPropostaSchema,
  patchPropostaSchema,
  atualizarStatusAdminSchema
} from '../schemas/proposta.schema'

const STATUS_EDITAVEIS_PELO_CLIENTE = ['pendente']
const STATUS_EXCLUIVEIS_PELO_CLIENTE = ['pendente', 'cancelada']

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

const obterUsuarioAutenticado = (res: Response) => {
  return (res.locals.auth?.id as string | undefined) ?? null
}

// Cliente envia proposta
export const criarProposta = async (req: Request, res: Response) => {
  const usuarioId = obterUsuarioAutenticado(res)

  const validacao = criarPropostaSchema.safeParse(req.body)
  if (!validacao.success) {
    return res.status(400).json(
      formatarErrosValidacao(validacao.error.flatten().fieldErrors)
    )
  }

  const { produtoId, mensagem } = validacao.data

  if (!usuarioId) {
    return res.status(401).json({ erro: 'Usuário não autenticado' })
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' })
    }

    const produto = await prisma.produto.findUnique({ where: { id: produtoId } })
    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado' })
    }

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
  const usuarioId = obterUsuarioAutenticado(res)
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

// Cliente atualiza proposta própria (PUT)
export const atualizarMinhaProposta = async (req: Request, res: Response) => {
  const usuarioId = obterUsuarioAutenticado(res)
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

  if (!usuarioId) {
    return res.status(401).json({ erro: 'Usuário não autenticado' })
  }

  const validacao = atualizarPropostaSchema.safeParse(req.body)
  if (!validacao.success) {
    return res.status(400).json(
      formatarErrosValidacao(validacao.error.flatten().fieldErrors)
    )
  }

  try {
    const proposta = await prisma.proposta.findFirst({
      where: { id, usuarioId }
    })

    if (!proposta) {
      return res.status(404).json({ erro: 'Proposta não encontrada' })
    }

    if (!STATUS_EDITAVEIS_PELO_CLIENTE.includes(proposta.status)) {
      return res.status(409).json({
        erro: 'Não é possível alterar proposta com status atual'
      })
    }

    const atualizada = await prisma.proposta.update({
      where: { id: proposta.id },
      data: {
        mensagem: validacao.data.mensagem
      },
      include: { produto: true }
    })

    return res.json(atualizada)
  } catch (erro) {
    console.error('Erro ao atualizar proposta:', erro)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

// Cliente atualiza parcialmente proposta própria (PATCH)
export const patchMinhaProposta = async (req: Request, res: Response) => {
  const usuarioId = obterUsuarioAutenticado(res)
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

  if (!usuarioId) {
    return res.status(401).json({ erro: 'Usuário não autenticado' })
  }

  const validacao = patchPropostaSchema.safeParse(req.body)
  if (!validacao.success) {
    return res.status(400).json(
      formatarErrosValidacao(validacao.error.flatten().fieldErrors)
    )
  }

  try {
    const proposta = await prisma.proposta.findFirst({
      where: { id, usuarioId }
    })

    if (!proposta) {
      return res.status(404).json({ erro: 'Proposta não encontrada' })
    }

    if (!STATUS_EDITAVEIS_PELO_CLIENTE.includes(proposta.status)) {
      return res.status(409).json({
        erro: 'Não é possível alterar proposta com status atual'
      })
    }

    if (validacao.data.status && validacao.data.status !== 'cancelada') {
      return res.status(400).json({ erro: 'Status inválido para cliente' })
    }

    const atualizada = await prisma.proposta.update({
      where: { id: proposta.id },
      data: {
        ...(validacao.data.mensagem && { mensagem: validacao.data.mensagem }),
        ...(validacao.data.status && { status: validacao.data.status })
      },
      include: { produto: true }
    })

    return res.json(atualizada)
  } catch (erro) {
    console.error('Erro ao atualizar proposta:', erro)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

// Cliente exclui proposta própria
export const excluirMinhaProposta = async (req: Request, res: Response) => {
  const usuarioId = obterUsuarioAutenticado(res)
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

  if (!usuarioId) {
    return res.status(401).json({ erro: 'Usuário não autenticado' })
  }

  try {
    const proposta = await prisma.proposta.findFirst({
      where: { id, usuarioId }
    })

    if (!proposta) {
      return res.status(404).json({ erro: 'Proposta não encontrada' })
    }

    if (!STATUS_EXCLUIVEIS_PELO_CLIENTE.includes(proposta.status)) {
      return res.status(409).json({
        erro: 'Não é possível excluir proposta com status atual'
      })
    }

    await prisma.proposta.delete({ where: { id: proposta.id } })
    return res.status(204).send()
  } catch (erro) {
    console.error('Erro ao excluir proposta:', erro)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

// Admin atualiza status de proposta
export const atualizarStatusPropostaAdmin = async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

  const validacao = atualizarStatusAdminSchema.safeParse(req.body)
  if (!validacao.success) {
    return res.status(400).json(
      formatarErrosValidacao(validacao.error.flatten().fieldErrors)
    )
  }

  try {
    const propostaExistente = await prisma.proposta.findUnique({ where: { id } })

    if (!propostaExistente) {
      return res.status(404).json({ erro: 'Proposta não encontrada' })
    }

    const proposta = await prisma.proposta.update({
      where: { id },
      data: {
        status: validacao.data.status,
        ...(validacao.data.resposta && { resposta: validacao.data.resposta })
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