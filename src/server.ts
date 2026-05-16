import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes'
import produtoRoutes from './routes/produto.routes'
import categoriaRoutes from './routes/categoria.routes'
import propostaRoutes from './routes/proposta.routes'
import adminRoutes from './routes/admin.routes'
import { info } from './lib/logger'




dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://garimpei-gamma.vercel.app'

const ALLOWED_ORIGINS = [FRONTEND_URL]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.use('/auth', authRoutes)

app.use('/produtos', produtoRoutes)
app.use('/categorias', categoriaRoutes)
app.use('/propostas', propostaRoutes)
app.use('/admin', adminRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'API funcionando!' })
})

app.listen(PORT, () => {
  info(`Servidor rodando na porta ${PORT}`)
})