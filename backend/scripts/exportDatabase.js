const fs = require('fs');
const path = require('path');
const sequelize = require('../src/config/db');
const env = require('../src/config/env');

const OUTPUT_DIR = path.join(__dirname, '..', 'database');
const CORE_TABLES = ['roles', 'permisos', 'rol_permisos', 'tipo_dia'];

function buildAdminUser() {
  if (!env.seedAdminPassword) {
    return null;
  }

  return {
    usuario_id: 1,
    rol_id: 1,
    nombre: 'Admin',
    apellido: 'Principal',
    username: 'admin',
    password: env.seedAdminPassword,
    imagen_url: null,
    estado: 1
  };
}

function escapeSqlString(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''");
}

function toSqlValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (value instanceof Date) {
    return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
  }

  if (Buffer.isBuffer(value)) {
    return `X'${value.toString('hex')}'`;
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }

  return `'${escapeSqlString(value)}'`;
}

async function exportSchema() {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();
  const schemaChunks = [
    '-- KRM Rent Car',
    '-- Esquema exportado desde la base local',
    '',
    'SET NAMES utf8mb4;',
    'SET FOREIGN_KEY_CHECKS = 0;',
    ''
  ];

  for (const tableName of tables) {
    const [rows] = await sequelize.query(`SHOW CREATE TABLE \`${tableName}\``);
    const createStatement = rows[0]['Create Table'];
    schemaChunks.push(`DROP TABLE IF EXISTS \`${tableName}\`;`);
    schemaChunks.push(`${createStatement};`);
    schemaChunks.push('');
  }

  schemaChunks.push('SET FOREIGN_KEY_CHECKS = 1;');
  schemaChunks.push('');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'schema.sql'), schemaChunks.join('\n'), 'utf8');

  return tables;
}

async function exportCoreSeed() {
  const adminUser = buildAdminUser();
  const seedChunks = [
    '-- KRM Rent Car',
    '-- Datos minimos para arrancar el sistema',
    '-- Este seed no publica credenciales por defecto.',
    '-- Si deseas incluir un admin inicial, exporta con SEED_ADMIN_PASSWORD configurado en tu .env local.',
    '',
    'SET NAMES utf8mb4;',
    'SET FOREIGN_KEY_CHECKS = 0;',
    ''
  ];

  for (const tableName of CORE_TABLES) {
    const [rows] = await sequelize.query(`SELECT * FROM \`${tableName}\``);
    if (rows.length === 0) {
      continue;
    }

    const columns = Object.keys(rows[0]).map((column) => `\`${column}\``).join(', ');
    const values = rows
      .map((row) => `(${Object.values(row).map(toSqlValue).join(', ')})`)
      .join(',\n');

    seedChunks.push(`DELETE FROM \`${tableName}\`;`);
    seedChunks.push(`INSERT INTO \`${tableName}\` (${columns}) VALUES`);
    seedChunks.push(`${values};`);
    seedChunks.push('');
  }

  if (adminUser) {
    seedChunks.push('DELETE FROM `usuarios`;');
    seedChunks.push(
      'INSERT INTO `usuarios` (`usuario_id`, `rol_id`, `nombre`, `apellido`, `username`, `password`, `imagen_url`, `estado`) VALUES'
    );
    seedChunks.push(`(${Object.values(adminUser).map(toSqlValue).join(', ')});`);
    seedChunks.push('');
  } else {
    seedChunks.push('-- No se incluyo usuario administrador inicial.');
    seedChunks.push('-- Crea tu usuario admin manualmente o vuelve a exportar definiendo SEED_ADMIN_PASSWORD en backend/.env.');
    seedChunks.push('');
  }

  seedChunks.push('SET FOREIGN_KEY_CHECKS = 1;');
  seedChunks.push('');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'seed-core.sql'), seedChunks.join('\n'), 'utf8');
}

async function main() {
  try {
    const tables = await exportSchema();
    await exportCoreSeed();
    console.log(`Base exportada correctamente. Tablas incluidas: ${tables.length}`);
  } finally {
    await sequelize.close();
  }
}

main().catch((error) => {
  console.error('No se pudo exportar la base:', error);
  process.exit(1);
});
