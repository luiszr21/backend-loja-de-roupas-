import { z } from 'zod'

export const produtoSchema = z.object({
  nome: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(200),
  descricao: z.string().trim().optional(),
  preco: z.number().positive('Preço deve ser maior que zero'),
  estoque: z.number().int().nonnegative('Estoque não pode ser negativo'),
  tamanho: z.enum(['PP', 'P', 'M', 'G', 'GG'], { message: 'Tamanho inválido' }),
  categoriaId: z.string().uuid('Categoria inválida'),
  imagemUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  destaque: z.boolean().optional()
})