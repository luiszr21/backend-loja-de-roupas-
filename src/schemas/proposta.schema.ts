import { z } from 'zod'

export const criarPropostaSchema = z.object({
  produtoId: z.string().uuid('Produto inválido'),
  mensagem: z.string().trim().min(5, 'Mensagem deve ter pelo menos 5 caracteres').max(1000, 'Mensagem muito longa')
})

export const atualizarPropostaSchema = z.object({
  mensagem: z.string().trim().min(5, 'Mensagem deve ter pelo menos 5 caracteres').max(1000, 'Mensagem muito longa')
})

export const patchPropostaSchema = z.object({
  mensagem: z.string().trim().min(5, 'Mensagem deve ter pelo menos 5 caracteres').max(1000, 'Mensagem muito longa').optional(),
  status: z.enum(['cancelada']).optional()
}).refine((data) => data.mensagem !== undefined || data.status !== undefined, {
  message: 'Informe ao menos um campo para atualização',
  path: ['body']
})

export const atualizarStatusAdminSchema = z.object({
  status: z.enum(['respondida', 'aceita', 'rejeitada']),
  resposta: z.string().trim().min(1, 'Resposta é obrigatória').max(1000, 'Resposta muito longa').optional()
}).superRefine((data, ctx) => {
  if ((data.status === 'respondida' || data.status === 'rejeitada') && !data.resposta) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['resposta'],
      message: 'Resposta é obrigatória para o status informado'
    })
  }
})
