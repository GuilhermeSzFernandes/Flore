import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const PUBLIC  = ['/', '/login', '/registro', '/agendar', '/api/auth', '/conectar']
const PRO     = ['/dashboard', '/agenda', '/clientes', '/configuracoes', '/onboarding', '/servicos']
const PATIENT = ['/minha-ficha', '/cliente']
const ADMIN   = ['/admin']

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  if (matches(pathname, PUBLIC) || PUBLIC.includes(pathname)) {
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const role = session.user?.role

  if (matches(pathname, ADMIN) && role !== 'admin') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Admin pode acessar tudo — não aplica restrições adicionais
  if (role === 'admin') return NextResponse.next()

  if (matches(pathname, PRO) && role !== 'professional') {
    return NextResponse.redirect(new URL('/minha-ficha', req.url))
  }

  if (matches(pathname, PATIENT) && role !== 'patient') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
