import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: 'http://localhost:5173' // porta padrão do Vite/React
}))
app.use(express.json())

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'API Loja de Roupas funcionando! 👗' })
})

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})