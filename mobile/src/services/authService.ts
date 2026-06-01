import { supabase } from '@/lib/supabase'

function isEmail(identifier: string) {
  return identifier.includes('@')
}

export const authService = {
  async signIn(identifier: string, password: string) {
    let email = identifier

    if (!isEmail(identifier)) {
      const { data, error } = await supabase.rpc('get_email_by_username', {
        p_username: identifier,
      })
      if (error || !data) throw new Error('Usuário não encontrado')
      email = data as string
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  async getProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('nome, username, perfil')
      .eq('id', userId)
      .single()
    return data
  },
}
