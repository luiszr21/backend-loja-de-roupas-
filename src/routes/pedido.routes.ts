import { Router } from 'express'
import { criarPedido, meusPedidos, listarPedidos, responderPedido } from '../controllers/pedido.controller'
import { autenticarCliente, autenticarAdmin } from '../middlewares/auth.middleware'

const router = Router()

router.post('/', autenticarCliente, criarPedido)
router.get('/meus', autenticarCliente, meusPedidos)
router.get('/', autenticarAdmin, listarPedidos)
router.patch('/:id', autenticarAdmin, responderPedido)

export default router