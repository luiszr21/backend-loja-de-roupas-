import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export const listarCategorias = async (req: Request, res: Response) => {
  try {
    const categorias = await prisma.categoria.findMany()
    return res.json(categorias)
  } catch {
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

export const cadastrarCategoria = async (req: Request, res: Response) => {
  const { nome } = req.body

  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' })

  try {
    const categoria = await prisma.categoria.create({ data: { nome } })
    return res.status(201).json(categoria)
  } catch {
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

export const removerCategoria = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    await prisma.categoria.delete({ where: { id } })
    return res.json({ mensagem: 'Categoria removida com sucesso' })
  } catch {
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}