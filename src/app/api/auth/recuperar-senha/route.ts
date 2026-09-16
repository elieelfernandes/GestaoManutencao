import { NextResponse } from 'next/server';
import crypto from 'crypto';
import sql from '../../../../utils/db';
import { ensureAuthAndAuditTablesExist, hashPassword } from '../../../../utils/auth';

// POST: Request password reset
export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Banco de dados não configurado.' }, { status: 500 });
  }

  try {
    await ensureAuthAndAuditTablesExist();

    const body = await request.json();
    const { loginOrEmail, token, novaSenha } = body;

    // Handle token reset execution
    if (token && novaSenha) {
      if (String(novaSenha).length < 6) {
        return NextResponse.json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' }, { status: 400 });
      }

      const tokens = await sql`
        SELECT id, usuario_id, expira_em, utilizado
        FROM usuarios_tokens_recuperacao
        WHERE token = ${token} AND utilizado = false AND expira_em > NOW()
        LIMIT 1
      `;

      if (tokens.length === 0) {
        return NextResponse.json({ error: 'Link de recuperação inválido ou expirado. Solicite uma nova redefinição.' }, { status: 400 });
      }

      const resetToken = tokens[0];
      const newHash = hashPassword(String(novaSenha));

      await sql`
        UPDATE usuarios_sistema 
        SET senha_hash = ${newHash}, precisa_trocar_senha = false, updated_at = NOW()
        WHERE id = ${resetToken.usuario_id}
      `;

      await sql`
        UPDATE usuarios_tokens_recuperacao 
        SET utilizado = true 
        WHERE id = ${resetToken.id}
      `;

      return NextResponse.json({ success: true, message: 'Senha redefinida com sucesso! Faça login com a nova senha.' });
    }

    // Handle password recovery request by login/email
    if (!loginOrEmail) {
      return NextResponse.json({ error: 'Informe seu usuário ou e-mail cadastrado.' }, { status: 400 });
    }

    const cleanInput = String(loginOrEmail).trim().toLowerCase();

    const users = await sql`
      SELECT id, nome, login, email
      FROM usuarios_sistema
      WHERE LOWER(login) = ${cleanInput} OR (email IS NOT NULL AND LOWER(email) = ${cleanInput})
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'Nenhum usuário encontrado com esse identificador.' }, { status: 404 });
    }

    const user = users[0];

    // Check if user has a registered email
    if (!user.email) {
      return NextResponse.json({
        hasEmail: false,
        message: 'Você não tem e-mail cadastrado para recuperação — peça a um Administrador para redefinir sua senha.'
      });
    }

    // Generate secure recovery token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await sql`
      INSERT INTO usuarios_tokens_recuperacao (usuario_id, token, expira_em)
      VALUES (${user.id}, ${resetToken}, ${expiresAt.toISOString()})
    `;

    return NextResponse.json({
      success: true,
      hasEmail: true,
      email: user.email,
      token: resetToken,
      message: `Token de recuperação gerado para ${user.email}. Utilize o link para redefinir sua senha.`
    });
  } catch (err: any) {
    console.error('API POST /api/auth/recuperar-senha Error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao processar recuperação de senha.' }, { status: 500 });
  }
}
