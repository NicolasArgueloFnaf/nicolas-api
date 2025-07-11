// Carrega o framework Express para criar a API web
const express = require('express');

// Inicializa o roteador para organizar os endpoints da aplicação
const routes = express.Router();

// Importa a conexão configurada com o banco PostgreSQL
const db = require('../db/connect');

/**
 * ROTA GET /
 * FINALIDADE: Recuperar a lista completa de produtos cadastrados.
 * PROCESSO:
 *  - Executa uma consulta SQL para obter todos os registros da tabela 'produto'.
 *  - Se obtiver sucesso, responde com status 200 e o array de produtos em JSON.
 *  - Se ocorrer erro, responde com status 500 e mensagem padrão de erro.
 */
routes.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM produto'); // Busca todos os produtos no banco
    res.status(200).json(result.rows); // Envia os produtos encontrados para o cliente
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar produtos' }); // Erro inesperado ao consultar o banco
  }
});

/**
 * ROTA POST /
 * FINALIDADE: Inserir um novo produto no banco de dados.
 * PROCESSO:
 *  - Recebe os dados do produto no corpo da requisição.
 *  - Valida se todos os campos obrigatórios estão preenchidos.
 *  - Insere o novo produto usando parâmetros para evitar SQL Injection.
 *  - Retorna o produto criado com status 201.
 *  - Em caso de erro, retorna status 500 com mensagem apropriada.
 */
routes.post('/', async (req, res) => {
  const { nome, marca, preco, peso } = req.body;

  // Validação para garantir que os campos essenciais não estejam vazios
  if (!nome || !marca || preco == null || peso == null) {
    return res.status(400).json({
      mensagem: 'Todos os campos são obrigatórios: nome, marca, preco, peso'
    });
  }

  try {
    // Preparação da query para inserir o produto no banco
    const sql = `
      INSERT INTO produto (nome, marca, preco, peso)
      VALUES ($1, $2, $3, $4)
      RETURNING *`;
    const valores = [nome, marca, preco, peso];

    const result = await db.query(sql, valores); // Executa a inserção
    res.status(201).json(result.rows[0]); // Retorna o produto recém-criado
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao criar produto' }); // Problema ao inserir o produto no banco
  }
});

/**
 * ROTA PUT /:id
 * FINALIDADE: Atualizar os dados de um produto existente.
 * PROCESSO:
 *  - Obtém o ID do produto pela URL e os novos dados pelo corpo da requisição.
 *  - Verifica se todos os campos necessários foram informados.
 *  - Atualiza o produto no banco, retornando os dados atualizados.
 *  - Se o produto não existir, retorna erro 404.
 *  - Caso aconteça algum erro no servidor, retorna status 500.
 */
routes.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, marca, preco, peso } = req.body;

  // Confirma que o ID foi passado na URL
  if (!id) {
    return res.status(400).json({ mensagem: 'O id precisa ser informado' });
  }

  // Verifica se todos os dados necessários foram enviados para atualização
  if (!nome || !marca || preco == null || peso == null) {
    return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
  }

  try {
    // Query para atualizar o produto com base no ID
    const sql = `
      UPDATE produto
      SET nome = $1, marca = $2, preco = $3, peso = $4
      WHERE id = $5
      RETURNING *`;
    const valores = [nome, marca, preco, peso, id];

    const result = await db.query(sql, valores); // Executa a atualização

    // Se não encontrou produto para atualizar, retorna 404
    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Produto não encontrado.' });
    }

    res.status(200).json(result.rows[0]); // Retorna o produto já atualizado
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar produto' }); // Falha inesperada ao tentar atualizar
  }
});

/**
 * ROTA DELETE /:id
 * FINALIDADE: Remover um produto do banco de dados.
 * PROCESSO:
 *  - Recebe o ID do produto via URL.
 *  - Executa comando para excluir o registro no banco.
 *  - Se não encontrar o produto, responde com 404.
 *  - Se deletar com sucesso, retorna mensagem de confirmação.
 *  - Em caso de falha, retorna erro 500.
 */
routes.delete('/:id', async (req, res) => {
  const { id } = req.params;

  // Garante que o ID foi informado para exclusão
  if (!id) {
    return res.status(400).json({ mensagem: 'O id precisa ser informado' });
  }

  try {
    // Query para deletar o produto conforme o ID informado
    const sql = `DELETE FROM produto WHERE id = $1 RETURNING *`;
    const result = await db.query(sql, [id]);

    // Caso o produto não exista, retorna erro 404
    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Produto não encontrado.' });
    }

    res.status(200).json({ mensagem: `Produto com ID ${id} excluído com sucesso` });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao excluir produto' }); // Erro durante a operação de exclusão
  }
});

// Disponibiliza as rotas para serem utilizadas em outras partes do sistema
module.exports = routes;
