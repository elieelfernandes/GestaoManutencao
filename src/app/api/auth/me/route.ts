import { NextResponse } from 'next/server';
import { getCurrentUser, ensureAuthAndAuditTablesExist } from '../../../../utils/auth';
import sql from '../../../../utils/db';

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }

  try {
    await ensureAuthAndAuditTablesExist();

    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    // Refresh user state from database in case permissions were updated
    const users = await sql`
      SELECT id, nome, login, email, cargo, perfil, status, permissoes, precisa_trocar_senha
      FROM usuarios_sistema
      WHERE id = ${session.id}
      LIMIT 1
    `;

    if (users.length === 0 || users[0].status === 'BLOQUEADO') {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const user = users[0];

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        nome: user.nome,
        login: user.login,
        email: user.email,
        cargo: user.cargo,
        perfil: user.perfil,
        permissoes: typeof user.permissoes === 'object' && user.permissoes !== null 
          ? user.permissoes 
          : { dashboard: true, ordens: true, ativos: false, cadastros: false },
        precisaTrocarSenha: Boolean(user.precisa_trocar_senha)
      }
    });
  } catch (err: any) {
    console.error('API GET /api/auth/me Error:', err);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
