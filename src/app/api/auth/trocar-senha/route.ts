import { NextResponse } from 'next/server';
import sql from '../../../../utils/db';
import { getCurrentUser, hashPassword } from '../../../../utils/auth';

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Banco de dados não configurado.' }, { status: 500 });
  }

  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const { novaSenha } = body;

    if (!novaSenha || String(novaSenha).length < 6) {
      return NextResponse.json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' }, { status: 400 });
    }

    const newHash = hashPassword(String(novaSenha));

    await sql`
      UPDATE usuarios_sistema 
      SET senha_hash = ${newHash}, precisa_trocar_senha = false, updated_at = NOW()
      WHERE id = ${session.id}
    `;

    return NextResponse.json({ success: true, message: 'Senha atualizada com sucesso!' });
  } catch (err: any) {
    console.error('API POST /api/auth/trocar-senha Error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao trocar senha.' }, { status: 500 });
  }
}
