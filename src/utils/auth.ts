import crypto from 'crypto';
import { cookies } from 'next/headers';
import sql from './db';
import { normalizeText } from './helpers';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

export interface UserSession {
  id: number;
  nome: string;
  login: string;
  email: string | null;
  cargo: string;
  perfil: 'ADMIN' | 'TECNICO';
  status: 'ATIVO' | 'BLOQUEADO';
  permissoes: {
    dashboard: boolean;
    ordens: boolean;
    ativos: boolean;
    cadastros: boolean;
  };
  precisaTrocarSenha: boolean;
  exp: number;
}

// Secret key derivation from env
function getSecretKey(): Buffer {
  const secret = process.env.SESSION_SECRET || 'marilux-cmms-production-secure-session-key-2026';
  return crypto.createHash('sha256').update(secret).digest();
}

// Password Hashing via PBKDF2
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return testHash === hash;
  } catch {
    return false;
  }
}

// Session Token Encryption via AES-256-GCM
export function encryptSession(session: UserSession): string {
  const key = getSecretKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(JSON.stringify(session), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptSession(token: string): UserSession | null {
  try {
    const key = getSecretKey();
    const [ivHex, authTagHex, encryptedHex] = token.split(':');
    if (!ivHex || !authTagHex || !encryptedHex) return null;
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    const session: UserSession = JSON.parse(decrypted);
    if (Date.now() > session.exp) return null;
    return session;
  } catch {
    return null;
  }
}

// Get Current User from Next.js Cookies
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('marilux_session')?.value;
    if (!sessionCookie) return null;
    return decryptSession(sessionCookie);
  } catch {
    return null;
  }
}

// Ensure Auth, User Management, Soft Delete, and Audit Tables Exist with Initial Seeds
export async function ensureAuthAndAuditTablesExist() {
  if (!process.env.DATABASE_URL) return;

  try {
    // 1. Create usuarios_sistema table
    await sql`
      CREATE TABLE IF NOT EXISTS usuarios_sistema (
        id                   SERIAL PRIMARY KEY,
        nome                 VARCHAR(255) NOT NULL,
        login                VARCHAR(255) UNIQUE NOT NULL,
        email                VARCHAR(255) UNIQUE,
        senha_hash           VARCHAR(255) NOT NULL,
        cargo                VARCHAR(100) DEFAULT 'Técnico',
        perfil               VARCHAR(50) NOT NULL DEFAULT 'TECNICO',
        status               VARCHAR(50) NOT NULL DEFAULT 'ATIVO',
        permissoes           JSONB NOT NULL DEFAULT '{"dashboard": true, "ordens": true, "ativos": false, "cadastros": false}',
        precisa_trocar_senha BOOLEAN NOT NULL DEFAULT true,
        created_at           TIMESTAMP DEFAULT NOW(),
        updated_at           TIMESTAMP DEFAULT NOW()
      )
    `;

    // 2. Create ordens_auditoria table
    await sql`
      CREATE TABLE IF NOT EXISTS ordens_auditoria (
        id                  SERIAL PRIMARY KEY,
        ordem_id            UUID NOT NULL,
        usuario_id          INTEGER REFERENCES usuarios_sistema(id),
        usuario_nome        VARCHAR(255) NOT NULL,
        usuario_login       VARCHAR(255) NOT NULL,
        tipo_acao           VARCHAR(50) NOT NULL,
        descricao_acao      TEXT NOT NULL,
        detalhes_alteracao  JSONB,
        created_at          TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_auditoria_ordem ON ordens_auditoria(ordem_id)`;

    // 3. Create password recovery tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS usuarios_tokens_recuperacao (
        id         SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios_sistema(id) ON DELETE CASCADE,
        token      VARCHAR(255) UNIQUE NOT NULL,
        expira_em  TIMESTAMP NOT NULL,
        utilizado  BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 4. Add soft delete & responsible columns to ordens_servico table
    await sql`
      ALTER TABLE ordens_servico 
      ADD COLUMN IF NOT EXISTS excluido_em TIMESTAMP,
      ADD COLUMN IF NOT EXISTS excluido_por_id INTEGER REFERENCES usuarios_sistema(id),
      ADD COLUMN IF NOT EXISTS motivo_exclusao TEXT,
      ADD COLUMN IF NOT EXISTS responsavel_id INTEGER REFERENCES usuarios_sistema(id)
    `;

    // 5. Seed General Admins (elieel.fernandes@gmail.com & gerencia.producao@marilux.com.br)
    const defaultPasswordHash = hashPassword('Marilux@123');
    const adminPermissions = JSON.stringify({
      dashboard: true,
      ordens: true,
      ativos: true,
      cadastros: true
    });

    const admins = [
      {
        nome: 'Eliel Fernandes',
        login: 'elieel.fernandes@gmail.com',
        email: 'elieel.fernandes@gmail.com',
        cargo: 'Administrador Geral'
      },
      {
        nome: 'Gerência de Produção',
        login: 'gerencia.producao@marilux.com.br',
        email: 'gerencia.producao@marilux.com.br',
        cargo: 'Gerência Geral'
      }
    ];

    for (const admin of admins) {
      const existing = await sql`SELECT id FROM usuarios_sistema WHERE login = ${admin.login} OR email = ${admin.email}`;
      if (existing.length === 0) {
        await sql`
          INSERT INTO usuarios_sistema (
            nome, login, email, senha_hash, cargo, perfil, status, permissoes, precisa_trocar_senha
          ) VALUES (
            ${admin.nome}, ${admin.login}, ${admin.email}, ${defaultPasswordHash}, 
            ${admin.cargo}, 'ADMIN', 'ATIVO', ${adminPermissions}::jsonb, false
          )
        `;
      }
    }

    // 6. Migrate existing technicians from cadastros_tecnicos
    const existingTecnicos = await sql`SELECT id, nome, area_atuacao FROM cadastros_tecnicos`;
    for (const tec of existingTecnicos) {
      const cleanLogin = tec.nome.toLowerCase().trim().replace(/\s+/g, '.');
      const tecExists = await sql`SELECT id FROM usuarios_sistema WHERE login = ${cleanLogin} OR nome = ${tec.nome}`;
      
      let usuarioId = tecExists[0]?.id;
      if (!usuarioId) {
        const tecPermissions = JSON.stringify({
          dashboard: true,
          ordens: true,
          ativos: false,
          cadastros: false
        });

        const newTec = await sql`
          INSERT INTO usuarios_sistema (
            nome, login, email, senha_hash, cargo, perfil, status, permissoes, precisa_trocar_senha
          ) VALUES (
            ${tec.nome}, ${cleanLogin}, NULL, ${defaultPasswordHash}, 
            ${tec.area_atuacao || 'Técnico'}, 'TECNICO', 'ATIVO', ${tecPermissions}::jsonb, true
          )
          RETURNING id
        `;
        usuarioId = newTec[0]?.id;
      }

      // Link historical work orders matching this technician name if responsavel_id is null
      if (usuarioId) {
        await sql`
          UPDATE ordens_servico 
          SET responsavel_id = ${usuarioId}
          WHERE (responsavel = ${tec.nome} OR responsavel_id IS NULL) AND responsavel = ${tec.nome}
        `;
      }
    }

  } catch (err) {
    console.error('Error in ensureAuthAndAuditTablesExist:', err);
  }
}

// Audit Logger Helper
export async function logOrdemAuditoria({
  ordemId,
  user,
  tipoAcao,
  descricaoAcao,
  detalhesAlteracao
}: {
  ordemId: string;
  user: UserSession | null;
  tipoAcao: 'CRIACAO' | 'ALTERACAO_STATUS' | 'EDICAO' | 'BAIXA' | 'EXCLUSAO';
  descricaoAcao: string;
  detalhesAlteracao?: any;
}) {
  try {
    const usuarioId = user?.id || null;
    const usuarioNome = user?.nome || 'Sistema';
    const usuarioLogin = user?.login || 'sistema';
    const detalhesJson = detalhesAlteracao ? JSON.stringify(detalhesAlteracao) : null;

    await sql`
      INSERT INTO ordens_auditoria (
        ordem_id, usuario_id, usuario_nome, usuario_login, tipo_acao, descricao_acao, detalhes_alteracao
      ) VALUES (
        ${ordemId}::uuid, ${usuarioId}, ${usuarioNome}, ${usuarioLogin}, ${tipoAcao}, ${descricaoAcao}, ${detalhesJson}::jsonb
      )
    `;
  } catch (err) {
    console.error('Error logging ordem auditoria:', err);
  }
}
