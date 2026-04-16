import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import prisma from '../lib/prisma'
import { produtoSchema } from '../schemas/produto.schema'

// Lista todos os produtos
export const listarProdutos = async (req: Request, res: Response) => {
  try {
    const { busca, categoriaId } = req.query

    const produtos = await prisma.produto.findMany({
      where: {
        ...(busca && { nome: { contains: busca as string, mode: 'insensitive' } }),
        ...(categoriaId && { categoriaId: categoriaId as string }),
        estoque: { gt: 0 }
      },
      include: { categoria: true },
      orderBy: { criadoEm: 'desc' }
    })

    return res.json(produtos)
  } catch (error) {
    console.error('Erro ao listar produtos:', error)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

// Lista produtos em destaque
export const listarDestaques = async (req: Request, res: Response) => {
  try {
    const produtos = await prisma.produto.findMany({
      where: { destaque: true, estoque: { gt: 0 } },
      include: { categoria: true }
    })

    return res.json(produtos)
  } catch (error) {
    console.error('Erro ao listar destaques:', error)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

// Detalhe de um produto
export const detalharProduto = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    const produto = await prisma.produto.findUnique({
      where: { id },
      include: { categoria: true }
    })

    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' })

    return res.json(produto)
  } catch (error) {
    console.error('Erro ao detalhar produto:', error)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

// Cadastrar produto (admin)
export const cadastrarProduto = async (req: Request, res: Response) => {
  const validacao = produtoSchema.safeParse(req.body)

  if (!validacao.success) {
    return res.status(400).json({ erros: validacao.error.flatten().fieldErrors })
  }

  try {
    const categoria = await prisma.categoria.findUnique({
      where: { id: validacao.data.categoriaId }
    })

    if (!categoria) {
      return res.status(404).json({ erro: 'Categoria não encontrada' })
    }

    const produto = await prisma.produto.create({ data: validacao.data })
    return res.status(201).json(produto)
  } catch (error) {
    console.error('Erro ao cadastrar produto:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return res.status(400).json({ erro: 'Categoria inválida para este produto' })
      }
    }

    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

// Editar produto (admin)
export const editarProduto = async (req: Request, res: Response) => {
  const validacao = produtoSchema.partial().safeParse(req.body)

  if (!validacao.success) {
    return res.status(400).json({ erros: validacao.error.flatten().fieldErrors })
  }

  try {
    const id = req.params.id as string

    if (validacao.data.categoriaId) {
      const categoria = await prisma.categoria.findUnique({
        where: { id: validacao.data.categoriaId }
      })

      if (!categoria) {
        return res.status(404).json({ erro: 'Categoria não encontrada' })
      }
    }

    const produto = await prisma.produto.update({
      where: { id },
      data: validacao.data
    })

    return res.json(produto)
  } catch (error) {
    console.error('Erro ao editar produto:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ erro: 'Produto não encontrado' })
      }

      if (error.code === 'P2003') {
        return res.status(400).json({ erro: 'Categoria inválida para este produto' })
      }
    }

    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

// Remover produto (admin)
export const removerProduto = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    await prisma.produto.delete({ where: { id } })
    return res.json({ mensagem: 'Produto removido com sucesso' })
  } catch (error) {
    console.error('Erro ao remover produto:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ erro: 'Produto não encontrado' })
    }

    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}