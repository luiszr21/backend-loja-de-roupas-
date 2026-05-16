import { Request, Response } from 'express'
import { Prisma, PropostaStatus } from '@prisma/client'
import prisma from '../lib/prisma'
import { info, error } from '../lib/logger'

type InteracaoStatusPublica = 'pendente' | 'respondida' | 'confirmada' | 'excluida'

const mapearStatusBancoParaPublico = (status: string | PropostaStatus): InteracaoStatusPublica => {
  switch (status) {
    case 'RESPONDIDA':
      return 'respondida'
    case 'ACEITA':
      return 'confirmada'
    case 'REJEITADA':
      return 'respondida'
    case 'CANCELADA':
      return 'excluida'
    default:
      return 'pendente'
  }
}

const mapearStatusPublicoParaBanco = (status?: string): PropostaStatus => {
  switch ((status ?? '').toLowerCase()) {
    case 'respondida':
      return 'RESPONDIDA'
    case 'confirmada':
      return 'ACEITA'
    case 'excluida':
      return 'CANCELADA'
    case 'pendente':
    default:
      return 'PENDENTE'
  }
}

const transformarInteracao = (proposta: any) => ({
  id: proposta.id,
  produtoId: proposta.produtoId,
  produtoNome: proposta.produto?.nome ?? null,
  usuarioId: proposta.usuarioId,
  usuarioNome: proposta.usuario?.nome ?? null,
  usuarioEmail: proposta.usuario?.email ?? null,
  mensagem: proposta.mensagem,
  status: mapearStatusBancoParaPublico(proposta.status),
  resposta: proposta.resposta,
  dataResponsta: proposta.atualizadoEm,
  criadoEm: proposta.criadoEm
})

export const dashboardStats = async (_req: Request, res: Response) => {
  try {
    const [totalProdutos, totalInteracoes, interacoesRespondidas, interacoesPendentes, totalUsuarios] = await Promise.all([
      prisma.produto.count({ where: { excluidoEm: null } }),
      prisma.proposta.count(),
      prisma.proposta.count({ where: { status: { in: ['RESPONDIDA', 'ACEITA'] } } }),
      prisma.proposta.count({ where: { status: 'PENDENTE' } }),
      prisma.usuario.count()
    ])

    const taxaRespostaPorcentagem = totalInteracoes > 0
      ? Math.round((interacoesRespondidas / totalInteracoes) * 100)
      : 0

    return res.json({
      totalProdutos,
      totalInteracoes,
      interacoesRespondidas,
      interacoesPendentes,
      totalUsuarios,
      taxaRespostaPorcentagem
    })
  } catch (erro) {
    error('Erro ao carregar dashboard:', erro)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

export const listarInteracoes = async (req: Request, res: Response) => {
  try {
    const statusRaw = req.query.status as string | undefined
    const pagina = Math.max(Number(req.query.pagina ?? req.query.page ?? 1), 1)
    const porPagina = Math.min(Math.max(Number(req.query.porPagina ?? req.query.limit ?? 10), 1), 100)
    const skip = (pagina - 1) * porPagina

    const where: Prisma.PropostaWhereInput = {}
    if (statusRaw) where.status = mapearStatusPublicoParaBanco(statusRaw)

    const [total, interacoes] = await Promise.all([
      prisma.proposta.count({ where }),
      prisma.proposta.findMany({
        where,
        include: {
          produto: { select: { nome: true } },
          usuario: { select: { id: true, nome: true, email: true } }
        },
        orderBy: { criadoEm: 'desc' },
        skip,
        take: porPagina
      })
    ])

    return res.json({
      interacoes: interacoes.map(transformarInteracao),
      total,
      pagina,
      porPagina
    })
  } catch (erro) {
    error('Erro ao listar interações:', erro)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

export const responderInteracao = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const resposta = String(req.body?.resposta ?? '').trim()

    if (!resposta) {
      return res.status(400).json({ erro: 'Resposta é obrigatória' })
    }

    const proposta = await prisma.proposta.update({
      where: { id },
      data: {
        resposta,
        status: 'RESPONDIDA'
      },
      include: {
        produto: { select: { nome: true } },
        usuario: { select: { id: true, nome: true, email: true } }
      }
    })

    return res.json(transformarInteracao(proposta))
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2025') {
      return res.status(404).json({ erro: 'Interação não encontrada' })
    }

    error('Erro ao responder interação:', erro)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

export const confirmarInteracao = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

    const proposta = await prisma.proposta.update({
      where: { id },
      data: { status: 'ACEITA' },
      include: {
        produto: { select: { nome: true } },
        usuario: { select: { id: true, nome: true, email: true } }
      }
    })

    return res.json(transformarInteracao(proposta))
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2025') {
      return res.status(404).json({ erro: 'Interação não encontrada' })
    }

    error('Erro ao confirmar interação:', erro)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

export const enviarEmailInteracao = async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email ?? '').trim()
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

    if (!email) {
      return res.status(400).json({ erro: 'Email é obrigatório' })
    }

    const proposta = await prisma.proposta.findUnique({
      where: { id },
      include: {
        produto: { select: { nome: true } },
        usuario: { select: { id: true, nome: true, email: true } }
      }
    })

    if (!proposta) {
      return res.status(404).json({ erro: 'Interação não encontrada' })
    }

    info('[EMAIL] Enviar para:', email, 'Interação:', proposta.id)

    return res.json({ message: 'Email enviado com sucesso' })
  } catch (erro) {
    error('Erro ao enviar email:', erro)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

export const excluirInteracao = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

    const proposta = await prisma.proposta.update({
      where: { id },
      data: { status: 'CANCELADA' },
      include: {
        produto: { select: { nome: true } },
        usuario: { select: { id: true, nome: true, email: true } }
      }
    })

    return res.json(transformarInteracao(proposta))
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2025') {
      return res.status(404).json({ erro: 'Interação não encontrada' })
    }

    error('Erro ao excluir interação:', erro)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

export const criarProdutoAdmin = async (req: Request, res: Response) => {
  try {
    const nome = String(req.body?.nome ?? '').trim()
    const preco = Number(req.body?.preco)
    const tamanho = String(req.body?.tamanho ?? 'M').trim() || 'M'
    const estoqueInformado = Number(req.body?.estoque)
    const categoriaId = req.body?.categoriaId ? String(req.body.categoriaId).trim() : null
    const descricao = req.body?.descricao ? String(req.body.descricao).trim() : null
    const imagemUrl = req.body?.imagemUrl ? String(req.body.imagemUrl).trim() : null
    const destaque = typeof req.body?.destaque === 'boolean' ? req.body.destaque : false

    const estoque = Number.isFinite(estoqueInformado) ? Math.floor(estoqueInformado) : 1

    if (!nome || Number.isNaN(preco) || preco <= 0 || estoque < 0) {
      return res.status(400).json({ erro: 'Dados inválidos' })
    }

    if (categoriaId) {
      const categoria = await prisma.categoria.findUnique({
        where: { id: categoriaId }
      })

      if (!categoria) {
        return res.status(404).json({ erro: 'Categoria não encontrada' })
      }
    }

    const produto = await prisma.produto.create({
      data: {
        nome,
        preco,
        tamanho,
        descricao,
        imagemUrl,
        estoque,
        categoriaId,
        destaque
      }
    })

    return res.status(201).json(produto)
  } catch (erro) {
    error('Erro ao criar produto admin:', erro)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

export const atualizarProdutoAdmin = async (req: Request, res: Response) => {
  try {
    const data: Record<string, unknown> = {}

    if (req.body?.nome !== undefined) data.nome = String(req.body.nome).trim()
    if (req.body?.preco !== undefined) data.preco = Number(req.body.preco)
    if (req.body?.tamanho !== undefined) data.tamanho = String(req.body.tamanho).trim()
    if (req.body?.descricao !== undefined) data.descricao = req.body.descricao ? String(req.body.descricao).trim() : null
    if (req.body?.imagemUrl !== undefined) data.imagemUrl = req.body.imagemUrl ? String(req.body.imagemUrl).trim() : null
    if (req.body?.estoque !== undefined) data.estoque = Number(req.body.estoque)
    if (req.body?.destaque !== undefined) data.destaque = Boolean(req.body.destaque)

    if (req.body?.categoriaId !== undefined) {
      const categoriaId = req.body.categoriaId ? String(req.body.categoriaId).trim() : null

      if (categoriaId) {
        const categoria = await prisma.categoria.findUnique({
          where: { id: categoriaId }
        })

        if (!categoria) {
          return res.status(404).json({ erro: 'Categoria não encontrada' })
        }
      }

      data.categoriaId = categoriaId
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

    const produto = await prisma.produto.update({
      where: { id },
      data
    })

    return res.json(produto)
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2025') {
      return res.status(404).json({ erro: 'Produto não encontrado' })
    }

    error('Erro ao atualizar produto admin:', erro)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

export const excluirProdutoAdmin = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

    await prisma.produto.delete({
      where: { id },
    })

    return res.json({ mensagem: 'Produto removido com sucesso' })
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2025') {
      return res.status(404).json({ erro: 'Produto não encontrado' })
    }

    error('Erro ao excluir produto admin:', erro)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}
