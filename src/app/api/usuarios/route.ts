import { NextResponse } from 'next/server';
import sql from '../../../utils/db';
import { getCurrentUser, hashPassword, ensureAuthAndAuditTablesExist } from '../../../utils/auth';

// GET: Fetch users
export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ usuarios: [] });
  }

  try {
    await ensureAuthAndAuditTablesExist();

    const session = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');

    // Mode "select" is allowed for active users to populate the "Responsável" dropdown in OS
    if (mode === 'select') {
      const activeUsers = await sql`
        SELECT id, nome, login, cargo, perfil
        FROM usuarios_sistema
        WHERE status = 'ATIVO'
        ORDER BY nome ASC
      `;
      return NextResponse.json({ usuarios: activeUsers });
    }

    // Full user management list is restricted to ADMIN
    if (!session || session.perfil !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso restrito a Administradores Gerais.' }, { status: 403 });
    }

    const allUsers = await sql`
      SELECT 
        id, nome, login, email, cargo, perfil, status, permissoes, 
        precisa_trocar_senha AS "precisaTrocarSenha",
        created_at AS "createdAt", updated_at AS "updatedAt"
      FROM usuarios_sistema
      ORDER BY 
        CASE WHEN perfil = 'ADMIN' THEN 0 ELSE 1 END,
        nome ASC
    `;

    return NextResponse.json({ usuarios: allUsers });
  } catch (err: any) {
    console.error('API GET /api/usuarios Error:', err);
    return NextResponse.json({ error: err.message || 'Falha ao buscar usuários.' }, { status: 500 });
  }
}

// POST: Create a new user (Restricted to ADMIN)
export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Banco de dados não configurado.' }, { status: 500 });
  }

  try {
    const session = await getCurrentUser();
    if (!session || session.perfil !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso restrito a Administradores Gerais.' }, { status: 403 });
    }

    const body = await request.json();
    const { nome, login, email, cargo, perfil, permissoes } = body;

    if (!nome || !login) {
      return NextResponse.json({ error: 'Nome e Usuário/Login são obrigatórios.' }, { status: 400 });
    }

    const cleanLogin = String(login).trim().toLowerCase();
    const cleanEmail = email && String(email).trim() !== '' ? String(email).trim().toLowerCase() : null;

    // Check if login already exists
    const existing = await sql`
      SELECT id FROM usuarios_sistema 
      WHERE LOWER(login) = ${cleanLogin} OR (email IS NOT NULL AND LOWER(email) = ${cleanLogin})
    `;
    if (existing.length > 0) {
      return NextResponse.json({ error: `O login "${cleanLogin}" já está em uso por outro usuário.` }, { status: 400 });
    }

    // Standard temporary password: Marilux@123
    const defaultPasswordHash = hashPassword('Marilux@123');
    const userRole = perfil === 'ADMIN' ? 'ADMIN' : 'TECNICO';
    const userPermissions = permissoes || (userRole === 'ADMIN' 
      ? { dashboard: true, ordens: true, ativos: true, cadastros: true }
      : { dashboard: true, ordens: true, ativos: false, cadastros: false });

    const result = await sql`
      INSERT INTO usuarios_sistema (
        nome, login, email, senha_hash, cargo, perfil, status, permissoes, precisa_trocar_senha
      ) VALUES (
        ${nome.trim()}, ${cleanLogin}, ${cleanEmail}, ${defaultPasswordHash},
        ${cargo || 'Técnico'}, ${userRole}, 'ATIVO', ${JSON.stringify(userPermissions)}::jsonb, true
      )
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      id: result[0]?.id,
      message: `Usuário "${nome}" criado com sucesso com senha provisória "Marilux@123".`
    });
  } catch (err: any) {
    console.error('API POST /api/usuarios Error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao criar usuário.' }, { status: 500 });
  }
}

// PUT: Edit user profile, permissions, status or reset password (Restricted to ADMIN)
export async function PUT(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Banco de dados não configurado.' }, { status: 500 });
  }

  try {
    const session = await getCurrentUser();
    if (!session || session.perfil !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso restrito a Administradores Gerais.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, nome, email, cargo, perfil, status, permissoes, resetPassword } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }

    const cleanEmail = email && String(email).trim() !== '' ? String(email).trim().toLowerCase() : null;

    if (resetPassword) {
      // Reset password to Marilux@123
      const defaultPasswordHash = hashPassword('Marilux@123');
      await sql`
        UPDATE usuarios_sistema 
        SET senha_hash = ${defaultPasswordHash}, precisa_trocar_senha = true, updated_at = NOW()
        WHERE id = ${id}
      `;
      return NextResponse.json({ success: true, message: 'Senha redefinida para a padrão "Marilux@123".' });
    }

    await sql`
      UPDATE usuarios_sistema SET
        nome = ${nome ? nome.trim() : sql`nome`},
        email = ${cleanEmail},
        cargo = ${cargo || sql`cargo`},
        perfil = ${perfil || sql`perfil`},
        status = ${status || sql`status`},
        permissoes = ${permissoes ? JSON.stringify(permissoes) : sql`permissoes`}::jsonb,
        updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, message: 'Usuário atualizado com sucesso.' });
  } catch (err: any) {
    console.error('API PUT /api/usuarios Error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao atualizar usuário.' }, { status: 500 });
  }
}
