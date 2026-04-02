import { z } from 'zod'

export const cadastroSchema = z.object({
  nome: z.string()
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),

  email: z.string()
    .trim()
    .email('Email inválido')
    .max(100, 'Email muito longo'),

  senha: z.string()
    .trim()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
    .regex(/[^a-zA-Z0-9]/, 'Senha deve conter pelo menos um caractere especial'),
})

export const loginSchema = z.object({
  email: z.string()
    .trim()
    .email('Email inválido'),

  senha: z.string()
    .trim()
    .min(1, 'Senha é obrigatória')
})