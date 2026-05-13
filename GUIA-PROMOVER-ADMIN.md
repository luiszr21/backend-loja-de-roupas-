# Guia: Promover Usuários a Admin

## 📋 Opção 1: Script Local (Recomendado para Desenvolvimento)

Use o script `scripts/manage-admin.js` para gerenciar admins diretamente do seu projeto:

### Comandos disponíveis:

```bash
# Promover usuário a admin
node scripts/manage-admin.js promote email@example.com

# Rebaixar usuário para cliente
node scripts/manage-admin.js demote email@example.com

# Listar todos os usuários
node scripts/manage-admin.js list

# Verificar status de um usuário
node scripts/manage-admin.js check email@example.com
```

### Exemplos práticos:

```bash
# Promover o usuário de teste
node scripts/manage-admin.js promote test+autotest@example.com

# Listar todos os usuários cadastrados
node scripts/manage-admin.js list

# Verificar se um usuário é admin
node scripts/manage-admin.js check test+autotest@example.com

# Rebaixar um admin de volta para cliente
node scripts/manage-admin.js demote test+autotest@example.com
```

---

## 🗄️ Opção 2: Diretamente no Neon Console (UI Gráfica)

1. Acesse [console.neon.tech](https://console.neon.tech)
2. Abra seu projeto PostgreSQL
3. Acesse a aba **SQL Editor**
4. Execute queries SQL diretas:

### Promover usuário:
```sql
UPDATE "Usuario" SET "isAdmin" = true WHERE email = 'test@example.com';
```

### Rebaixar usuário:
```sql
UPDATE "Usuario" SET "isAdmin" = false WHERE email = 'test@example.com';
```

### Listar todos os usuários:
```sql
SELECT id, nome, email, "isAdmin", "criadoEm" FROM "Usuario" ORDER BY "criadoEm" DESC;
```

### Contar admins:
```sql
SELECT COUNT(*) as total_admins FROM "Usuario" WHERE "isAdmin" = true;
```

---

## 🔑 Permissões e Autenticação

Após promover um usuário a admin:

1. **Login normalmente** com esse usuário (email + senha)
2. **Token JWT** será gerado com role `admin`
3. **Endpoints admin** agora estarão acessíveis:
   - `GET /admin/dashboard` — Estatísticas gerais
   - `GET /admin/interacoes` — Listar propostas
   - `PATCH /admin/interacoes/:id/responder` — Responder proposta
   - `PATCH /admin/interacoes/:id/confirmar` — Confirmar proposta
   - `DELETE /admin/interacoes/:id` — Excluir proposta
   - `POST /admin/produtos` — Criar produto
   - `PATCH /admin/produtos/:id` — Atualizar produto
   - `DELETE /admin/produtos/:id` — Excluir produto

---

## 📝 Campo de Banco de Dados

No Neon, a estrutura do `Usuario` agora é:

```sql
CREATE TABLE "Usuario" (
  id UUID PRIMARY KEY,
  nome VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  senha VARCHAR NOT NULL,
  isAdmin BOOLEAN DEFAULT false,  -- ← Campo novo
  "criadoEm" TIMESTAMP DEFAULT NOW()
);
```

**Detalhes:**
- `isAdmin: boolean` — `true` = admin, `false` = cliente comum
- Padrão: `false` (todos os novos usuários são clientes)
- Pode mudar o status a qualquer tempo (promover/rebaixar)

---

## 🧪 Testar Acesso Admin

1. Promova um usuário:
   ```bash
   node scripts/manage-admin.js promote test@example.com
   ```

2. Faça login:
   ```bash
   curl -X POST http://localhost:3001/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","senha":"Abc12345!"}'
   ```

3. Copie o `token` da resposta e acesse um endpoint admin:
   ```bash
   curl -X GET http://localhost:3001/admin/dashboard \
     -H "Authorization: Bearer <seu_token_aqui>"
   ```

4. Deve retornar `200` com estatísticas. Se retornar `403 Acesso negado`, o usuário não é admin.

---

## 💡 Dicas Extras

- **Remover modelo `Admin`**: Agora redundante. Você pode remover a tabela `Admin` quando quiser (apenas use `Usuario.isAdmin`).
- **Auditoria**: Considere adicionar um campo `atualizadoPor` ou `ultimaAtualizacao` se precisar rastrear mudanças.
- **Backup**: Antes de fazer promoções em massa, faça backup no Neon.

---

## ❓ Troubleshooting

**"Erro: Email não encontrado"**
- Verifique se o usuário existe com `node scripts/manage-admin.js check email@example.com`

**"Token inválido ou acesso negado em endpoint admin"**
- Confirme que o usuário foi promovido: `node scripts/manage-admin.js list`
- Regera o token fazendo login novamente

**"Prisma não consegue conectar ao Neon"**
- Verifique se `DATABASE_URL` está configurada em `.env`
- Teste: `npx prisma studio` para acessar a UI do Prisma
