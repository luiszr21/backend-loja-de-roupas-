// Script de diagnóstico para testar envio de proposta
// Execute: node scripts/test-proposta.js

const http = require('http');
const logger = require('./logger')

if (process.env.NODE_ENV === 'production') {
  console.error('Não execute scripts em produção')
  process.exit(1)
}

const BASE_URL = 'http://localhost:3001';

// Cores para console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, title, message = '') {
  logger.info(`\n${color}[${title}]${colors.reset} ${message}`)
}

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    log(colors.cyan, 'REQUEST', `${method} ${path}`);
    if (body) {
      log(colors.cyan, 'BODY', JSON.stringify(body, null, 2));
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  try {
    log(colors.blue, 'INÍCIO', 'Iniciando testes de proposta...\n');

    // Passo 1: Login
    log(colors.yellow, 'PASSO 1', 'Tentando fazer login...');
    const loginResponse = await makeRequest('POST', '/auth/login', {
      email: 'test+autotest@example.com',
      senha: 'Abc12345!'
    });

    if (loginResponse.status !== 200) {
      log(colors.red, 'ERRO', `Login falhou! Status: ${loginResponse.status}`);
      log(colors.red, 'RESPOSTA', JSON.stringify(loginResponse.body, null, 2));
      process.exit(1);
    }

    const token = loginResponse.body.token;
    log(colors.green, 'SUCESSO', `Token obtido: ${token.substring(0, 20)}...`);

    // Passo 2: Listar produtos
    log(colors.yellow, 'PASSO 2', 'Listando produtos...');
    const produtosResponse = await makeRequest('GET', '/produtos');

    if (produtosResponse.status !== 200) {
      log(colors.red, 'ERRO', `Falha ao listar produtos! Status: ${produtosResponse.status}`);
      log(colors.red, 'RESPOSTA', JSON.stringify(produtosResponse.body, null, 2));
      process.exit(1);
    }

    const produtos = produtosResponse.body;
    if (!Array.isArray(produtos) || produtos.length === 0) {
      log(colors.red, 'ERRO', 'Nenhum produto disponível!');
      process.exit(1);
    }

    const produto = produtos[0];
    log(colors.green, 'SUCESSO', `${produtos.length} produtos encontrados`);
    log(colors.cyan, 'PRODUTO', `ID: ${produto.id}, Nome: ${produto.nome}, Estoque: ${produto.estoque}`);

    if (produto.estoque <= 0) {
      log(colors.red, 'AVISO', `Primeiro produto (${produto.id}) tem estoque = 0`);
      const produtoComEstoque = produtos.find(p => p.estoque > 0);
      if (!produtoComEstoque) {
        log(colors.red, 'ERRO', 'Nenhum produto com estoque > 0!');
        process.exit(1);
      }
      log(colors.green, 'INFO', `Usando produto: ${produtoComEstoque.id}`);
    }

    const produtoId = produto.estoque > 0 ? produto.id : produtos.find(p => p.estoque > 0).id;

    // Passo 3: Criar proposta
    log(colors.yellow, 'PASSO 3', 'Criando proposta...');
    const propostaResponse = await makeRequest('POST', '/propostas', {
      produtoId: produtoId,
      mensagem: 'Esta é uma mensagem de teste para proposta com mais de 5 caracteres'
    }, {
      'Authorization': `Bearer ${token}`
    });

    log(colors.cyan, 'STATUS', `Status da resposta: ${propostaResponse.status}`);
    log(colors.cyan, 'RESPOSTA', JSON.stringify(propostaResponse.body, null, 2));

    if (propostaResponse.status === 201) {
      log(colors.green, 'SUCESSO', 'Proposta criada com sucesso!');
      const proposta = propostaResponse.body;
      log(colors.cyan, 'DETALHES', `
        ID: ${proposta.id}
        Usuário: ${proposta.usuarioId}
        Produto: ${proposta.produtoId}
        Status: ${proposta.status}
        Mensagem: ${proposta.mensagem}
        Criado em: ${proposta.criadoEm}
      `);
    } else if (propostaResponse.status === 409) {
      log(colors.yellow, 'AVISO', 'Proposta duplicada - Cliente já fez proposta para este produto');
    } else if (propostaResponse.status === 401) {
      log(colors.red, 'ERRO', 'Não autenticado - Verifique o token');
    } else if (propostaResponse.status === 403) {
      log(colors.red, 'ERRO', 'Acesso negado - Verifique o role do usuário');
    } else if (propostaResponse.status === 400) {
      log(colors.red, 'ERRO', 'Dados inválidos - Verifique os campos');
    } else if (propostaResponse.status === 404) {
      log(colors.red, 'ERRO', 'Recurso não encontrado - Usuário ou Produto não existe');
    } else {
      log(colors.red, 'ERRO', `Erro inesperado! Status: ${propostaResponse.status}`);
    }

    log(colors.blue, 'FIM', 'Teste concluído!\n');

  } catch (error) {
    log(colors.red, 'ERRO FATAL', error.message);
    logger.error(error);
    process.exit(1);
  }
}

runTests();
