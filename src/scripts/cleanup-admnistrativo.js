const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let dbUrl = process.env.DATABASE_URL;
const envPath = path.join(__dirname, '..', '..', '.env.local');
if (!dbUrl && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/DATABASE_URL=(.*)/);
  if (match) dbUrl = match[1].trim();
}

if (!dbUrl) {
  console.error('ERRO: DATABASE_URL não encontrada!');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function cleanup() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Garante que o setor correto 'Administrativo' existe no cadastro
    await client.query(`
      INSERT INTO cadastros_setores (nome) 
      VALUES ('Administrativo') 
      ON CONFLICT (nome) DO NOTHING
    `);

    // 2. Atualiza todas as ordens de serviço apontando para o nome errado
    const updateRes = await client.query(`
      UPDATE ordens_servico 
      SET setor = 'Administrativo' 
      WHERE setor = 'Admnistrativo'
    `);
    console.log(`[ATUALIZAÇÃO] ${updateRes.rowCount} ordens de serviço alteradas de 'Admnistrativo' para 'Administrativo'.`);

    // 3. Remove o cadastro incorreto
    const deleteRes = await client.query(`
      DELETE FROM cadastros_setores 
      WHERE nome = 'Admnistrativo'
    `);
    console.log(`[EXCLUSÃO] Setor incorreto 'Admnistrativo' removido do cadastro (${deleteRes.rowCount} registros).`);

    await client.query('COMMIT');
    console.log('\n[SUCESSO] Ajuste de setor efetuado com transação salva.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao efetuar limpeza do setor:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanup();
