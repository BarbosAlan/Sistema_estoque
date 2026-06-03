'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function PerfilPage() {
  const [nome, setNome] = useState('')
  const [username, setUsername] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(true)

  const [savingNome, setSavingNome] = useState(false)
  const [nomeMsg, setNomeMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('nome, username')
        .eq('id', user.id)
        .single()
      if (data) {
        setNome(data.nome)
        setUsername(data.username)
      }
      setLoadingProfile(false)
    })
  }, [])

  async function handleSaveNome(e: React.FormEvent) {
    e.preventDefault()
    setSavingNome(true)
    setNomeMsg(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao salvar')
      setNomeMsg({ ok: true, text: 'Nome atualizado com sucesso.' })
    } catch (err) {
      setNomeMsg({ ok: false, text: err instanceof Error ? err.message : 'Erro ao salvar.' })
    } finally {
      setSavingNome(false)
    }
  }

  async function handleSavePwd(e: React.FormEvent) {
    e.preventDefault()
    if (novaSenha !== confirmarSenha) {
      setPwdMsg({ ok: false, text: 'As senhas não coincidem.' })
      return
    }
    if (novaSenha.length < 8) {
      setPwdMsg({ ok: false, text: 'A senha deve ter ao menos 8 caracteres.' })
      return
    }
    setSavingPwd(true)
    setPwdMsg(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: novaSenha })
      if (error) throw error
      setNovaSenha('')
      setConfirmarSenha('')
      setPwdMsg({ ok: true, text: 'Senha alterada com sucesso.' })
    } catch (err) {
      setPwdMsg({ ok: false, text: err instanceof Error ? err.message : 'Erro ao alterar senha.' })
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Meu perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados pessoais</CardTitle>
          <CardDescription>
            @{loadingProfile ? '...' : username}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveNome} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                disabled={loadingProfile}
                required
                minLength={2}
              />
            </div>
            {nomeMsg && (
              <p className={`text-sm ${nomeMsg.ok ? 'text-primary' : 'text-destructive'}`}>
                {nomeMsg.text}
              </p>
            )}
            <Button type="submit" size="sm" disabled={savingNome || loadingProfile}>
              {savingNome ? 'Salvando...' : 'Salvar nome'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alterar senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSavePwd} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="novaSenha">Nova senha</Label>
              <Input
                id="novaSenha"
                type="password"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
              <Input
                id="confirmarSenha"
                type="password"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                required
              />
            </div>
            {pwdMsg && (
              <p className={`text-sm ${pwdMsg.ok ? 'text-primary' : 'text-destructive'}`}>
                {pwdMsg.text}
              </p>
            )}
            <Button type="submit" size="sm" disabled={savingPwd}>
              {savingPwd ? 'Salvando...' : 'Alterar senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
