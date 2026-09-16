import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.set('marilux_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });

    return NextResponse.json({ success: true, message: 'Logout realizado com sucesso.' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao deslogar.' }, { status: 500 });
  }
}
