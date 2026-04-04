import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import 'dotenv/config'  

export const autenticarCliente = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader) return res.status(401).json({ erro: 'Token não fornecido' })

  const token = authHeader.split(' ')[1] // formato: "Bearer token"

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string, tipo: string }

    if (decoded.tipo !== 'cliente') return res.status(403).json({ erro: 'Acesso negado' })

      req.headers['usuarioId'] = decoded.id

    next()
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado' })
  }
}

export const autenticarAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization


  if (!authHeader) return res.status(401).json({ erro: 'Token não fornecido' })

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string, tipo: string }

    if (decoded.tipo !== 'admin') return res.status(403).json({ erro: 'Acesso negado' })

    req.headers['adminId'] = decoded.id
    next()
  } catch (error) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' })
  }
}

