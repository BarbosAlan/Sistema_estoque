function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}`)
  return value
}

export const env = {
  supabase: {
    url: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    // serviceRoleKey só é acessível no servidor
    get serviceRoleKey() {
      return requireEnv('SUPABASE_SERVICE_ROLE_KEY')
    },
  },
} as const
