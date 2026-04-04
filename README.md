# 👗 Loja de Roupas — Backend
 
Projeto acadêmico desenvolvido para a disciplina de **Programação FullStack** do Curso Superior de Tecnologia em Análise e Desenvolvimento de Sistemas — UniSenac Campus Pelotas.
 
**Integrantes:** Luis e Vicente  
**Professor:** Edécio Fernando Iepsen  
**Apresentação:** 07/05/2026
 
---
 
## 📋 Sobre o Projeto
 
Sistema full stack de gerenciamento de uma loja de roupas. O backend é uma API REST que permite o cadastro e gerenciamento de produtos, clientes, carrinhos, pedidos e pagamentos, além de uma área restrita para administradores.
 
---
 
## 🛠️ Tecnologias
 
- **Node.js** com **TypeScript**
- **Express** — framework HTTP
- **Prisma ORM** — comunicação com o banco de dados
- **PostgreSQL** via **Neon** — banco de dados na nuvem
- **JWT** — autenticação por token
- **bcryptjs** — criptografia de senhas
 
---
 
## 🗂️ Estrutura de Pastas
 
```
backend/
├── prisma/
│   ├── schema.prisma       # Modelos do banco de dados
│   └── migrations/         # Histórico de alterações no banco
├── src/
│   ├── controllers/        # Lógica de cada rota
│   ├── middlewares/        # Autenticação e validações
│   ├── routes/             # Definição das rotas da API
│   └── server.ts           # Entrada da aplicação
├── .env                    # Variáveis de ambiente (não vai ao Git)
├── .gitignore
├── package.json
└── tsconfig.json
```


## 🚀 Como Rodar o Projeto
 
### Pré-requisitos
 
- Node.js instalado
- Conta no [Neon](https://neon.tech) com um projeto criado
 
### Instalação
 
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/loja-roupas.git
 
# Entre na pasta do backend
cd backend-loja-roupas
 
# Instale as dependências
npm install
```
 
### Configuração do `.env`
 
Crie um arquivo `.env` na raiz do backend com as seguintes variáveis:
 
```env
DATABASE_URL="sua_connection_string_do_neon"
PORT=3001
JWT_SECRET="sua_chave_secreta"
```
 
### Rodando as migrations
 
```bash
npx prisma migrate dev
```
 
### Iniciando o servidor
 
```bash
# Modo desenvolvimento
npm run dev
 
# Modo produção
npm run build
npm start
```

 
