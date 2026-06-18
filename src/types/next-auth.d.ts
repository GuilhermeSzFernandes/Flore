import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'professional' | 'patient' | 'admin'
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    role?: 'professional' | 'patient' | 'admin'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'professional' | 'patient' | 'admin'
  }
}
