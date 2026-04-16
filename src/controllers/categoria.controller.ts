import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import prisma from '../lib/prisma'

export const listarCategorias = async (req: Request, res: Response) => {
  try {
    const categorias = await prisma.categoria.findMany()
    return res.json(categorias)
  } catch (error) {
    console.error('Erro ao listar categorias:', error)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

export const cadastrarCategoria = async (req: Request, res: Response) => {
  const { nome } = req.body

  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' })

  try {
    const categoria = await prisma.categoria.create({ data: { nome } })
    return res.status(201).json(categoria)
  } catch (error) {
    console.error('Erro ao cadastrar categoria:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ erro: 'Categoria já cadastrada' })
    }

    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

export const removerCategoria = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    await prisma.categoria.delete({ where: { id } })
    return res.json({ mensagem: 'Categoria removida com sucesso' })
  } catch (error) {
    console.error('Erro ao remover categoria:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ erro: 'Categoria não encontrada' })
      }

      if (error.code === 'P2003') {
        return res.status(409).json({ erro: 'Não é possível remover categoria com produtos vinculados' })
      }
    }

    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}