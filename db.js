import { Pool } from 'pg';

// Configura el pool de conexión a PostgreSQL, utilizando variables de entorno
const pool = new Pool({
    user: process.env.PG_USER,         // Usuario de PostgreSQL
    host: process.env.PG_HOST,         // Host de PostgreSQL
    database: process.env.PG_DATABASE, // Nombre de la base de datos
    password: process.env.PG_PASSWORD, // Contraseña de PostgreSQL
    port: process.env.PG_PORT || 5432, // Puerto de PostgreSQL (por defecto 5432)
    ssl: {
        rejectUnauthorized: false      // Si utilizas un certificado auto-firmado, establece esta opción a false
    }
});

export default pool;
