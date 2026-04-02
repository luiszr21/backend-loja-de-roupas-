import { Router } from 'express'
import { listarCategorias, cadastrarCategoria, removerCategoria } from '../controllers/categoria.controller'
import { autenticarAdmin } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', listarCategorias)
router.post('/', autenticarAdmin, cadastrarCategoria)
router.delete('/:id', autenticarAdmin, removerCategoria)

export default router