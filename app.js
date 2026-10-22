const express = require("express");
const { sql, poolPromise } = require("./config/db");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.json({ mensagem: "API de produtos funcionando!" });
});

const tiposJoin = new Map([
    ["inner", "INNER JOIN"],
    ["left", "LEFT JOIN"],
    ["right", "RIGHT JOIN"]
]);

app.get("/consultas/:tipo", async (req, res) => {
    const join = tiposJoin.get(req.params.tipo);

    if (!join) {
        return res.status(400).json({
            erro: "Utilize inner, left ou right."
        });
    }

    try {
        const pool = await poolPromise;

        const resultado = await pool.request().query(`
            SELECT
                produtos.Id AS ProdutoId,
                produtos.Nome AS Produto,
                produtos.Preco,
                produtos.Quantidade,
                categorias.Id AS CategoriaId,
                categorias.Nome AS Categoria
            FROM dbo.Produtos AS produtos
            ${join} dbo.Categorias AS categorias
                ON produtos.CategoriaId = categorias.Id
            ORDER BY categorias.Id, produtos.Id
        `);

        return res.json(resultado.recordset);
    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro ao consultar com JOIN"
        });
    }
});

app.post("/produtos", async (req, res) => {
    const { nome, preco, quantidade, categoriaId = null } = req.body || {};

    try {
        const pool = await poolPromise;

        const resultado = await pool.request()
            .input("nome", sql.NVarChar(100), nome)
            .input("preco", sql.Decimal(10, 2), preco)
            .input("quantidade", sql.Int, quantidade)
            .input("categoriaId", sql.Int, categoriaId)
            .query(`
                INSERT INTO dbo.Produtos
                    (Nome, Preco, Quantidade, CategoriaId)
                OUTPUT INSERTED.Id
                VALUES
                    (@nome, @preco, @quantidade, @categoriaId)
            `);

        return res.status(201).json({
            mensagem: "Produto cadastrado!",
            id: resultado.recordset[0].Id
        });
    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro ao cadastrar produto"
        });
    }
});

app.get("/produtos", async (req, res) => {
    try {
        const pool = await poolPromise;

        const resultado = await pool.request().query(`
            SELECT Id, Nome, Preco, Quantidade, CategoriaId
            FROM dbo.Produtos
            ORDER BY Id
        `);

        return res.json(resultado.recordset);
    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro ao consultar produtos"
        });
    }
});

app.get("/produtos/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            erro: "ID inválido"
        });
    }

    try {
        const pool = await poolPromise;

        const resultado = await pool.request()
            .input("id", sql.Int, id)
            .query(`
                SELECT Id, Nome, Preco, Quantidade, CategoriaId
                FROM dbo.Produtos
                WHERE Id = @id
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({
                erro: "Produto não encontrado"
            });
        }

        return res.json(resultado.recordset[0]);
    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro ao consultar produto"
        });
    }
});

app.put("/atualizarProdutos/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { nome, preco, quantidade, categoriaId = null } = req.body || {};

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            erro: "ID inválido"
        });
    }

    try {
        const pool = await poolPromise;

        const resultado = await pool.request()
            .input("id", sql.Int, id)
            .input("nome", sql.NVarChar(100), nome)
            .input("preco", sql.Decimal(10, 2), preco)
            .input("quantidade", sql.Int, quantidade)
            .input("categoriaId", sql.Int, categoriaId)
            .query(`
                UPDATE dbo.Produtos
                SET Nome = @nome,
                    Preco = @preco,
                    Quantidade = @quantidade,
                    CategoriaId = @categoriaId
                WHERE Id = @id
            `);

        if (resultado.rowsAffected[0] === 0) {
            return res.status(404).json({
                erro: "Produto não encontrado"
            });
        }

        return res.json({
            mensagem: "Produto atualizado!"
        });
    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro ao atualizar produto"
        });
    }
});

app.delete("/deletarProdutos/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            erro: "ID inválido"
        });
    }

    try {
        const pool = await poolPromise;

        const resultado = await pool.request()
            .input("id", sql.Int, id)
            .query("DELETE FROM dbo.Produtos WHERE Id = @id");

        if (resultado.rowsAffected[0] === 0) {
            return res.status(404).json({
                erro: "Produto não encontrado"
            });
        }

        return res.json({
            mensagem: "Produto excluído!"
        });
    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro ao excluir produto"
        });
    }
});

app.listen(3000, () => {
    console.log("Servidor executando na porta 3000");
});