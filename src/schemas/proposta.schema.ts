import { z } from 'zod'

export const STATUS_PROPOSTA = ['PENDENTE', 'RESPONDIDA', 'ACEITA', 'REJEITADA', 'CANCELADA'] as const

export const criarPropostaSchema = z.object({
  produtoId: z.coerce.string().min(1, 'Produto inválido'),
  mensagem: z.string().trim().min(5, 'Mensagem deve ter pelo menos 5 caracteres').max(1000, 'Mensagem muito longa')
})

export const atualizarPropostaSchema = z.object({
  mensagem: z.string().trim().min(5, 'Mensagem deve ter pelo menos 5 caracteres').max(1000, 'Mensagem muito longa')
})

export const patchPropostaSchema = z.object({
  mensagem: z.string().trim().min(5, 'Mensagem deve ter pelo menos 5 caracteres').max(1000, 'Mensagem muito longa').optional(),
  status: z.enum(['CANCELADA']).optional()
}).refine((data) => data.mensagem !== undefined || data.status !== undefined, {
  message: 'Informe ao menos um campo para atualização',
  path: ['body']
})

export const atualizarStatusAdminSchema = z.object({
  status: z.enum(['RESPONDIDA', 'ACEITA', 'REJEITADA']),
  resposta: z.string().trim().min(1, 'Resposta é obrigatória').max(1000, 'Resposta muito longa').optional()
}).superRefine((data, ctx) => {
  if ((data.status === 'RESPONDIDA' || data.status === 'REJEITADA') && !data.resposta) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['resposta'],
      message: 'Resposta é obrigatória para o status informado'
    })
  }
})

export const listarPropostasQuerySchema = z.object({
  status: z.enum(STATUS_PROPOSTA).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
})
