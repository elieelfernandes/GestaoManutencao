import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '../../../../utils/db';
import { 
  ensureAuthAndAuditTablesExist, 
  verifyPassword, 
  encryptSession, 
  UserSession 
} from '../../../../utils/auth';

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Banco de dados não configurado.' }, { status: 500 });
  }

  try {
    await ensureAuthAndAuditTablesExist();

    const body = await request.json();
    const { login, senha } = body;

    if (!login || !senha) {
      return NextResponse.json({ error: 'Usuário/E-mail e senha são obrigatórios.' }, { status: 400 });
    }

    const cleanLogin = String(login).trim().toLowerCase();

    // Query user by login OR email
    const users = await sql`
      SELECT id, nome, login, email, senha_hash, cargo, perfil, status, permissoes, precisa_trocar_senha
      FROM usuarios_sistema
      WHERE LOWER(login) = ${cleanLogin} OR (email IS NOT NULL AND LOWER(email) = ${cleanLogin})
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'Credenciais inválidas. Verifique seu usuário/e-mail e senha.' }, { status: 401 });
    }

    const user = users[0];

    // Check account status
    if (user.status === 'BLOQUEADO') {
      return NextResponse.json({ error: 'Esta conta está temporariamente bloqueada. Contate um Administrador.' }, { status: 403 });
    }

    // Verify password hash
    const isValid = verifyPassword(senha, user.senha_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Credenciais inválidas. Verifique seu usuário/e-mail e senha.' }, { status: 401 });
    }

    // Create session (7 days validity)
    const sessionData: UserSession = {
      id: user.id,
      nome: user.nome,
      login: user.login,
      email: user.email || null,
      cargo: user.cargo || 'Técnico',
      perfil: user.perfil || 'TECNICO',
      status: user.status || 'ATIVO',
      permissoes: typeof user.permissoes === 'object' && user.permissoes !== null 
        ? user.permissoes 
        : { dashboard: true, ordens: true, ativos: false, cadastros: false },
      precisaTrocarSenha: Boolean(user.precisa_trocar_senha),
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000
    };

    const token = encryptSession(sessionData);

    const cookieStore = await cookies();
    cookieStore.set('marilux_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
    });

    return NextResponse.json({
      success: true,
      user: {
        id: sessionData.id,
        nome: sessionData.nome,
        login: sessionData.login,
        email: sessionData.email,
        cargo: sessionData.cargo,
        perfil: sessionData.perfil,
        permissoes: sessionData.permissoes,
        precisaTrocarSenha: sessionData.precisaTrocarSenha
      }
    });
  } catch (err: any) {
    console.error('API POST /api/auth/login Error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao realizar login.' }, { status: 500 });
  }
}
