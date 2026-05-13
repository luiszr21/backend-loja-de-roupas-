#!/usr/bin/env node
// Script para promover/despromover usuários a admin
// Uso:
//   node scripts/manage-admin.js promote email@example.com
//   node scripts/manage-admin.js demote email@example.com
//   node scripts/manage-admin.js list
//   node scripts/manage-admin.js check email@example.com

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const command = process.argv[2];
const email = process.argv[3];

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = (color, text) => console.log(`${color}${text}${colors.reset}`);

async function promover(email) {
  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      log(colors.red, `❌ Usuário não encontrado: ${email}`);
      process.exit(1);
    }

    if (usuario.isAdmin) {
      log(colors.yellow, `⚠️  Usuário já é admin: ${email}`);
      process.exit(0);
    }

    const atualizado = await prisma.usuario.update({
      where: { id: usuario.id },
      data: { isAdmin: true }
    });

    log(colors.green, `✅ Promovido a admin: ${atualizado.email}`);
  } catch (erro) {
    log(colors.red, `❌ Erro: ${erro.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function despromover(email) {
  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      log(colors.red, `❌ Usuário não encontrado: ${email}`);
      process.exit(1);
    }

    if (!usuario.isAdmin) {
      log(colors.yellow, `⚠️  Usuário não é admin: ${email}`);
      process.exit(0);
    }

    const atualizado = await prisma.usuario.update({
      where: { id: usuario.id },
      data: { isAdmin: false }
    });

    log(colors.green, `✅ Rebaixado para cliente: ${atualizado.email}`);
  } catch (erro) {
    log(colors.red, `❌ Erro: ${erro.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function listar() {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nome: true, email: true, isAdmin: true, criadoEm: true },
      orderBy: { criadoEm: 'desc' }
    });

    if (usuarios.length === 0) {
      log(colors.yellow, 'Nenhum usuário encontrado');
      process.exit(0);
    }

    log(colors.cyan, `\n${colors.bold}=== Usuários Cadastrados ===${colors.reset}`);
    usuarios.forEach((u, idx) => {
      const admin = u.isAdmin ? colors.green + '👤 ADMIN' : colors.yellow + '👥 CLIENTE';
      console.log(`\n${idx + 1}. ${admin}${colors.reset}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Nome: ${u.nome}`);
      console.log(`   ID: ${u.id}`);
      console.log(`   Criado em: ${new Date(u.criadoEm).toLocaleString('pt-BR')}`);
    });
    log(colors.cyan, `\nTotal: ${usuarios.length} usuário(s)\n`);
  } catch (erro) {
    log(colors.red, `❌ Erro: ${erro.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function verificar(email) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true, nome: true, email: true, isAdmin: true, criadoEm: true }
    });

    if (!usuario) {
      log(colors.red, `❌ Usuário não encontrado: ${email}`);
      process.exit(1);
    }

    const status = usuario.isAdmin ? colors.green + 'ADMIN' : colors.yellow + 'CLIENTE';
    log(colors.cyan, `\n=== Usuário ===${colors.reset}`);
    console.log(`Nome: ${usuario.nome}`);
    console.log(`Email: ${usuario.email}`);
    console.log(`Status: ${status}${colors.reset}`);
    console.log(`ID: ${usuario.id}`);
    console.log(`Criado em: ${new Date(usuario.criadoEm).toLocaleString('pt-BR')}\n`);
  } catch (erro) {
    log(colors.red, `❌ Erro: ${erro.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  if (!command) {
    log(colors.cyan, `
${colors.bold}=== Gerenciador de Admin ===${colors.reset}

Uso:
  node scripts/manage-admin.js promote email@example.com   # Promover a admin
  node scripts/manage-admin.js demote email@example.com     # Rebaixar para cliente
  node scripts/manage-admin.js list                         # Listar todos os usuários
  node scripts/manage-admin.js check email@example.com      # Verificar status
    `);
    process.exit(0);
  }

  switch (command.toLowerCase()) {
    case 'promote':
      if (!email) {
        log(colors.red, '❌ Email é obrigatório');
        process.exit(1);
      }
      await promover(email);
      break;
    case 'demote':
      if (!email) {
        log(colors.red, '❌ Email é obrigatório');
        process.exit(1);
      }
      await despromover(email);
      break;
    case 'list':
      await listar();
      break;
    case 'check':
      if (!email) {
        log(colors.red, '❌ Email é obrigatório');
        process.exit(1);
      }
      await verificar(email);
      break;
    default:
      log(colors.red, `❌ Comando desconhecido: ${command}`);
      process.exit(1);
  }
}

main();
