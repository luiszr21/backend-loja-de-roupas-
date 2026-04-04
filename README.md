# 👗 Loja de Roupas — Documentação do Backend
 
## 📋 Informações do Projeto
 
| | |
|---|---|
| **Projeto** | Loja de Roupas — Backend |
| **Disciplina** | Linguagens de Programação Emergentes |
| **Professor** | Edécio Fernando Iepsen |
| **Integrantes** | Luis e Vicente |
| **Apresentação** | 07/05/2026 |
 
---
 
## 🛠️ Tecnologias Utilizadas
 
| Tecnologia | Versão | Função |
|---|---|---|
| Node.js | - | Ambiente de execução |
| TypeScript | 5.x | Linguagem principal |
| Express | 4.x | Framework HTTP |
| Prisma ORM | 5.x | Comunicação com banco |
| PostgreSQL | - | Banco de dados |
| Neon | - | Banco na nuvem |
| JWT | - | Autenticação por token |
| bcryptjs | - | Criptografia de senhas |
| Zod | - | Validação de dados |
 
---
 
## 🗂️ Estrutura de Pastas
 
```
backend/
├── prisma/
│   ├── schema.prisma       
│   └── migrations/         
├── src/
│   ├── lib/
│   │   └── prisma.ts           # Instância única do Prisma
│   ├── schemas/
│   │   ├── auth.schema.ts      # Validações de autenticação
│   │   └── produto.schema.ts   # Validações de produto
│   ├── controllers/
│   │   ├── auth.controller.ts      # Lógica de autenticação
│   │   ├── produto.controller.ts   # Lógica de produtos
│   │   ├── categoria.controller.ts # Lógica de categorias
│   │   └── pedido.controller.ts    # Lógica de pedidos
│   ├── middlewares/
│   │   └── auth.middleware.ts  # Proteção de rotas
│   ├── routes/
│   │   ├── auth.routes.ts      # Rotas de autenticação
│   │   ├── produto.routes.ts   # Rotas de produtos
│   │   ├── categoria.routes.ts # Rotas de categorias
│   │   └── pedido.routes.ts    # Rotas de pedidos
│   └── server.ts               # Entrada da aplicação
├── .env                    
├── .gitignore
├── package.json
└── tsconfig.json
```
 
---
 
## 🗃️ Banco de Dados
 
### Diagrama de Tabelas
 
| Tabela | Descrição |
|---|---|
| `Admin` | Administradores do sistema |
| `Usuario` | Clientes cadastrados |
| `Endereco` | Endereços dos clientes |
| `Categoria` | Categorias das roupas |
| `Produto` | Peças da loja (tabela principal) |
| `Carrinho` | Carrinho de compras |
| `ItemCarrinho` | Itens dentro do carrinho |
| `Pedido` | Pedidos finalizados |
| `ItemPedido` | Itens dentro do pedido |
| `Pagamento` | Pagamento vinculado ao pedido |
 
### Relacionamentos
 
- `Usuario` tem muitos `Endereco`
- `Usuario` tem muitos `Carrinho`
- `Usuario` tem muitos `Pedido`
- `Categoria` tem muitos `Produto`
- `Carrinho` tem muitos `ItemCarrinho`
- `Pedido` tem muitos `ItemPedido`
- `Pedido` tem um `Pagamento`
 
---
 
## 🔐 Autenticação
 
O sistema usa **JWT (JSON Web Token)** para autenticação. O token é gerado no login e deve ser enviado no header de todas as requisições protegidas.
 
### Como usar o token
 
```
Authorization: Bearer seu_token_aqui
```
 
### Tipos de usuário
 
| Tipo | Acesso |
|---|---|
| `cliente` | Rotas públicas + suas próprias interações |
| `admin` | Todas as rotas incluindo área restrita |
 
### Validações com Zod
 
**Cadastro:**
- Nome: mínimo 2 caracteres, apenas letras
- Email: formato válido
- Senha: mínimo 8 caracteres, uma maiúscula, um número, um caractere especial
 
**Login:**
- Email: formato válido
- Senha: obrigatória
 
---
 
## 🌐 Rotas da API
 
### Base URL
```
http://localhost:3001
```
 
---
 
### 🔑 Autenticação — `/auth`
 
| Método | Rota | Proteção | Descrição |
|---|---|---|---|
| POST | `/auth/cadastro` | Pública | Cadastro de cliente |
| POST | `/auth/login` | Pública | Login de cliente |
| POST | `/auth/admin/login` | Pública | Login de admin |
 
**Exemplo — Cadastro:**
```json
// POST /auth/cadastro
// Body:
{
  "nome": "Luis",
  "email": "luis@email.com",
  "senha": "Senha@123"
}
 
// Resposta 201:
{
  "mensagem": "Cadastro realizado!",
  "id": "uuid-gerado"
}
```
 
**Exemplo — Login:**
```json
// POST /auth/login
// Body:
{
  "email": "luis@email.com",
  "senha": "Senha@123"
}
 
// Resposta 200:
{
  "token": "eyJhbGci...",
  "usuario": {
    "id": "uuid",
    "nome": "Luis",
    "email": "luis@email.com"
  }
}
```
 
---
 
### 📦 Produtos — `/produtos`
 
| Método | Rota | Proteção | Descrição |
|---|---|---|---|
| GET | `/produtos` | Pública | Listar todos os produtos |
| GET | `/produtos/destaques` | Pública | Listar produtos em destaque |
| GET | `/produtos/:id` | Pública | Detalhe de um produto |
| POST | `/produtos` | Admin | Cadastrar produto |
| PUT | `/produtos/:id` | Admin | Editar produto |
| DELETE | `/produtos/:id` | Admin | Remover produto |
 
**Filtros disponíveis:**
```
GET /produtos?busca=camiseta
GET /produtos?categoriaId=uuid-da-categoria
```
 
**Exemplo — Cadastrar produto:**
```json
// POST /produtos
// Header: Authorization: Bearer token_admin
// Body:
{
  "nome": "Camiseta Básica",
  "descricao": "Camiseta 100% algodão",
  "preco": 49.90,
  "estoque": 10,
  "tamanho": "M",
  "categoriaId": "uuid-da-categoria",
  "imagemUrl": "https://...",
  "destaque": true
}
```
 
**Tamanhos aceitos:** `PP`, `P`, `M`, `G`, `GG`
 
---
 
### 🏷️ Categorias — `/categorias`
 
| Método | Rota | Proteção | Descrição |
|---|---|---|---|
| GET | `/categorias` | Pública | Listar categorias |
| POST | `/categorias` | Admin | Cadastrar categoria |
| DELETE | `/categorias/:id` | Admin | Remover categoria |
 
---
 
### 🛍️ Pedidos — `/pedidos`
 
| Método | Rota | Proteção | Descrição |
|---|---|---|---|
| POST | `/pedidos` | Cliente | Fazer um pedido |
| GET | `/pedidos/meus` | Cliente | Ver meus pedidos |
| GET | `/pedidos` | Admin | Ver todos os pedidos |
| PATCH | `/pedidos/:id` | Admin | Responder pedido |
 
**Status disponíveis:** `pendente`, `confirmado`, `cancelado`
 
**Exemplo — Fazer pedido:**
```json
// POST /pedidos
// Header: Authorization: Bearer token_cliente
// Body:
{
  "produtoId": "uuid-do-produto",
  "quantidade": 1,
  "observacao": "Quero na cor azul"
}
```
 
**Exemplo — Admin responde:**
```json
// PATCH /pedidos/:id
// Header: Authorization: Bearer token_admin
// Body:
{
  "status": "confirmado"
}
```
 
---
 
## ⚠️ Códigos de Erro
 
| Código | Significado |
|---|---|
| 400 | Dados inválidos ou email já cadastrado |
| 401 | Token não fornecido ou inválido |
| 403 | Sem permissão para acessar |
| 404 | Item não encontrado |
| 500 | Erro interno do servidor |
 
---
 
## 🚀 Como Rodar Localmente
 
```bash
# 1. Instalar dependências
npm install
 
# 2. Configurar o .env
DATABASE_URL="sua_connection_string_do_neon"
PORT=3001
JWT_SECRET="sua_chave_secreta"
 
# 3. Rodar migrations
npx prisma migrate dev
 
# 4. Iniciar servidor
npm run dev
```
 
---
 
## ✅ Requisitos do Trabalho Atendidos
 
| # | Requisito | Status |
|---|---|---|
| 1 | Exibir destaques e últimos cadastrados | ✅ |
| 2 | Pesquisa para filtrar itens | ✅ |
| 3 | Login e cadastro de clientes | ✅ |
| 4 | Detalhes + interação só para logados | ✅ |
| 5 | Cliente vê suas interações | ✅ |
| 6 | Área restrita para admins | ✅ |
| 7 | Dashboard com gráficos | ⏳ Pendente |
| 8 | Listagem e cadastro do item principal | ✅ |
| 9 | Admin gerencia interações | ✅ |
| 10 | Deploy na nuvem | ⏳ Pendente |
