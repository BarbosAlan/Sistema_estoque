import { createClient } from '@/lib/supabase'

function isEmail(identifier: string) {
  return identifier.includes('@')
}

export const authService = {
  async signIn(identifier: string, password: string) {
    const supabase = createClient()

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
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async resetPassword(email: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/recuperar-senha/nova-senha`,
    })
    if (error) throw error
  },

  async updatePassword(newPassword: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },

  async getSession() {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },
}
