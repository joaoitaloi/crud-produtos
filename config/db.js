const sql = require("mssql/msnodesqlv8");
require("dotenv").config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    driver: "ODBC Driver 18 for SQL Server",
    options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate:
        process.env.DB_TRUST_CERT === "true"
    }
};

const poolPromise = new sql.ConnectionPool(config).connect();
poolPromise
    .then(() => {
        console.log("Conectado ao banco de dados!");
    })
    .catch((erro) => {
        console.error("Erro ao conectar ao banco:", erro);
    });
    
module.exports = { sql, poolPromise}
