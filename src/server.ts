import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes'
import produtoRoutes from './routes/produto.routes'
import categoriaRoutes from './routes/categoria.routes'
import pedidoRoutes from './routes/pedido.routes'




dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: 'http://localhost:5173'
}))
app.use(express.json())

app.use('/auth', authRoutes)

app.use('/produtos', produtoRoutes)
app.use('/categorias', categoriaRoutes)
app.use('/pedidos', pedidoRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'API Loja de Roupas funcionando! 👗' })
})

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})