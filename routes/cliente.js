// Puxa o Express para criar rotas na aplicação
const express = require('express');

// Cria um roteador, que é tipo um mini app dentro do app principal
const routes = express.Router();

// Importa a conexão com o banco de dados (PostgreSQL)
const db = require('../db/connect');

/**
 * GET /
 * Pega todos os clientes que estão no banco.
 * Faz uma consulta simples e retorna a lista.
 */
routes.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM cliente'); // Puxa todos os clientes
    res.status(200).json(result.rows); // Manda a lista para quem pediu
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar clientes' }); // Se der ruim, responde erro 500
  }
});

/**
 * POST /
 * Recebe dados do cliente no corpo da requisição e salva no banco.
 * Valida se todos os dados necessários foram enviados.
 */
routes.post('/', async (req, res) => {
  const { nome, email, telefone, endereco, cidade, uf } = req.body;

  if (!nome || !email || !telefone || !endereco || !cidade || !uf) {
    return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
  }

  try {
    const sql = `
      INSERT INTO cliente (nome, email, telefone, endereco, cidade, uf)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`;
    const valores = [nome, email, telefone, endereco, cidade, uf];

    const result = await db.query(sql, valores); // Insere o cliente no banco
    res.status(201).json(result.rows[0]); // Retorna o cliente recém-criado
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao criar cliente' }); // Caso tenha problema na inserção
  }
});

/**
 * PUT /:id
 * Atualiza os dados do cliente com o id informado na URL.
 * Confere se tudo foi enviado e se o cliente existe.
 */
routes.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, email, telefone, endereco, cidade, uf } = req.body;

  if (!id) {
    return res.status(400).json({ mensagem: 'O id precisa ser informado' });
  }

  if (!nome || !email || !telefone || !endereco || !cidade || !uf) {
    return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
  }

  try {
    const sql = `
      UPDATE cliente
      SET nome = $1, email = $2, telefone = $3, endereco = $4, cidade = $5, uf = $6
      WHERE id = $7
      RETURNING *`;
    const valores = [nome, email, telefone, endereco, cidade, uf, id];

    const result = await db.query(sql, valores);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar cliente' });
  }
});

/**
 * DELETE /:id
 * Remove o cliente do banco pelo id.
 * Verifica se o id foi passado e se o cliente existe.
 */
routes.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ mensagem: 'O id precisa ser informado' });
  }

  try {
    const sql = `DELETE FROM cliente WHERE id = $1 RETURNING *`;
    const result = await db.query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
    }

    res.status(200).json({ mensagem: `Cliente com ID ${id} excluído com sucesso` });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao excluir cliente' });
  }
});

// Exporta o conjunto de rotas para que possa ser usado em outros arquivos
module.exports = routes;