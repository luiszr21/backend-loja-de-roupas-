import { Request, Response } from 'express'
import prisma from '../lib/prisma'

// Cliente faz um pedido
export const criarPedido = async (req: Request, res: Response) => {
  const usuarioId = req.headers['usuarioId'] as string
  const { produtoId, quantidade, observacao } = req.body

  try {
    const produto = await prisma.produto.findUnique({ where: { id: produtoId } })

    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' })
    if (produto.estoque < quantidade) return res.status(400).json({ erro: 'Estoque insuficiente' })

    const pedido = await prisma.pedido.create({
      data: {
        usuarioId,
        valorTotal: produto.preco * quantidade,
        itens: {
          create: {
            produtoId,
            quantidade,
            precoUnitario: produto.preco
          }
        }
      },
      include: { itens: true }
    })

    return res.status(201).json(pedido)
  } catch {
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

// Cliente vê seus pedidos
export const meusPedidos = async (req: Request, res: Response) => {
  const usuarioId = req.headers['usuarioId'] as string

  try {
    const pedidos = await prisma.pedido.findMany({
      where: { usuarioId },
      include: {
        itens: { include: { produto: true } },
        pagamento: true
      },
      orderBy: { dataPedido: 'desc' }
    })

    return res.json(pedidos)
  } catch {
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

// Admin lista todos os pedidos
export const listarPedidos = async (req: Request, res: Response) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
        itens: { include: { produto: true } },
        pagamento: true
      },
      orderBy: { dataPedido: 'desc' }
    })

    return res.json(pedidos)
  } catch {
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

// Admin responde um pedido
export const responderPedido = async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const { status } = req.body

  if (!['confirmado', 'cancelado'].includes(status)) {
    return res.status(400).json({ erro: 'Status inválido' })
  }

  try {
    const pedido = await prisma.pedido.update({
      where: { id },
      data: { status }
    })

    return res.json(pedido)
  } catch {
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}