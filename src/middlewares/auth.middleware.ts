import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'
import 'dotenv/config'  

type Role = 'user' | 'admin'

type TokenPayload = {
  id: string
  role?: Role
  tipo?: string
  jti?: string
  exp?: number
}

const extrairRole = (payload: TokenPayload): Role | null => {
  if (payload.role === 'user' || payload.role === 'admin') {
    return payload.role
  }

  // Compatibilidade com tokens antigos
  if (payload.tipo === 'cliente') return 'user'
  if (payload.tipo === 'admin') return 'admin'

  return null
}

const validarToken = async (req: Request, res: Response) => {
  // Tentar obter token do header Authorization ou do cookie
  const authHeader = req.headers.authorization
  let token: string | undefined

  if (authHeader) {
    const [scheme, bearerToken] = authHeader.split(' ')
    if (scheme === 'Bearer' && bearerToken) {
      token = bearerToken
    }
  }

  // Fallback: tentar do cookie se não achou no header
  if (!token && (req.cookies as any)?.token) {
    token = (req.cookies as any).token
  }

  if (!token) {
    res.status(401).json({ erro: 'Token não fornecido' })
    return null
  }

  try {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      console.error('[ERRO] JWT_SECRET não definido')
      res.status(500).json({ erro: 'Configuração do servidor inválida' })
      return null
    }

    const decoded = jwt.verify(token, secret) as TokenPayload
    const role = extrairRole(decoded)

    if (!decoded.id || !role || !decoded.jti || !decoded.exp) {
      res.status(401).json({ erro: 'Token inválido ou expirado' })
      return null
    }

    const tokenRevogado = await prisma.tokenRevogado.findUnique({
      where: { jti: decoded.jti }
    })

    if (tokenRevogado) {
      res.status(401).json({ erro: 'Token inválido ou expirado' })
      return null
    }

    return { id: decoded.id, role, jti: decoded.jti, exp: decoded.exp }
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado' })
    return null
  }
}

export const autenticarCliente = async (req: Request, res: Response, next: NextFunction) => {
  const auth = await validarToken(req, res)
  if (!auth) {
    return  // Já respondeu com erro
  }

  console.log('[AUTH] autenticarCliente - role:', auth.role, 'id:', auth.id)

  if (auth.role !== 'user') {
    return res.status(403).json({ erro: 'Acesso negado', receivedRole: auth.role })
  }

  res.locals.auth = auth
  next()
}

export const autenticarUsuario = async (req: Request, res: Response, next: NextFunction) => {
  const auth = await validarToken(req, res)
  if (!auth) {
    return  // Já respondeu com erro
  }

  res.locals.auth = auth
  next()
}

export const autenticarAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const auth = await validarToken(req, res)
  if (!auth) {
    return  // Já respondeu com erro
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: auth.id },
    select: { isAdmin: true }
  })

  if (usuario?.isAdmin) {
    res.locals.auth = auth
    next()
    return
  }

  const admin = await prisma.admin.findUnique({
    where: { id: auth.id },
    select: { id: true }
  })

  if (!admin) {
    return res.status(403).json({ erro: 'Acesso negado - apenas administradores' })
  }

  res.locals.auth = auth
  next()
}

