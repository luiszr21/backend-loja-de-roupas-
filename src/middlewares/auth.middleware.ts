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
  const authHeader = req.headers.authorization

  if (!authHeader) {
    res.status(401).json({ erro: 'Token não fornecido' })
    return null
  }

  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ erro: 'Token inválido ou expirado' })
    return null
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload
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
  if (!auth) return

  if (auth.role !== 'user') {
    return res.status(403).json({ erro: 'Acesso negado' })
  }

  res.locals.auth = auth
  next()
}

export const autenticarUsuario = async (req: Request, res: Response, next: NextFunction) => {
  const auth = await validarToken(req, res)
  if (!auth) return

  res.locals.auth = auth
  next()
}

export const autenticarAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const auth = await validarToken(req, res)
  if (!auth) return

  if (auth.role !== 'admin') {
    return res.status(403).json({ erro: 'Acesso negado' })
  }

  res.locals.auth = auth
  next()
}

