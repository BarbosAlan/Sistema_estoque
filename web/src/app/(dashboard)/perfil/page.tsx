'use client'

import { useState, useEffect } from 'react'
import { UserCircle, ShieldCheck, AtSign, Mail, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PERFIS } from '@estoque/shared'
import type { Perfil } from '@estoque/shared'

const PERFIL_COLORS: Record<Perfil, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  estoquista: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  funcionario: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
}

interface ProfileData {
  nome: string
  username: string
  perfil: Perfil
  email: string
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [nome, setNome] = useState('')
  const [savingNome, setSavingNome] = useState(false)

  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showNova, setShowNova] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('nome, username, perfil')
        .eq('id', user.id)
        .single()
      if (data) {
        const p: ProfileData = {
          nome: data.nome,
          username: data.username,
          perfil: data.perfil as Perfil,
          email: user.email ?? '',
        }
        setProfile(p)
        setNome(data.nome)
      }
    })
  }, [])

  async function handleSaveNome(e: React.FormEvent) {
    e.preventDefault()
    setSavingNome(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao salvar')
      setProfile(prev => prev ? { ...prev, nome } : prev)
      toast.success('Nome atualizado com sucesso.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar nome.')
    } finally {
      setSavingNome(false)
    }
  }

  async function handleSavePwd(e: React.FormEvent) {
    e.preventDefault()
    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem.')
      return
    }
    if (novaSenha.length < 8) {
      toast.error('A senha deve ter ao menos 8 caracteres.')
      return
    }
    setSavingPwd(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: novaSenha })
      if (error) throw error
      setNovaSenha('')
      setConfirmarSenha('')
      toast.success('Senha alterada com sucesso.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar senha.')
    } finally {
      setSavingPwd(false)
    }
  }

  const initials = (profile?.nome ?? '')
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Meu perfil</h1>

      {/* Avatar + info resumida */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center shrink-0">
              {initials
                ? <span className="text-xl font-bold text-primary-foreground">{initials}</span>
                : <UserCircle className="h-8 w-8 text-primary-foreground" />
              }
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="font-semibold text-lg leading-tight truncate">{profile?.nome ?? '...'}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {profile?.perfil && (
                  <Badge className={`gap-1 text-xs ${PERFIL_COLORS[profile.perfil]}`}>
                    <ShieldCheck className="h-3 w-3" />
                    {PERFIS[profile.perfil]}
                  </Badge>
                )}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <AtSign className="h-3 w-3" />
                  {profile?.username ?? '...'}
                </span>
              </div>
              {profile?.email && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {profile.email}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados pessoais</CardTitle>
          <CardDescription>Atualize seu nome de exibição.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveNome} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Usuário</Label>
              <Input id="username" value={profile?.username ?? ''} disabled className="bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome de exibição</Label>
              <Input
                id="nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                disabled={!profile}
                required
                minLength={2}
              />
            </div>
            <Button type="submit" size="sm" disabled={savingNome || !profile || nome === profile.nome}>
              {savingNome ? 'Salvando...' : 'Salvar nome'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Alterar senha */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alterar senha</CardTitle>
          <CardDescription>Mínimo de 8 caracteres.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSavePwd} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="novaSenha">Nova senha</Label>
              <div className="relative">
                <Input
                  id="novaSenha"
                  type={showNova ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  minLength={8}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNova(v => !v)}
                  tabIndex={-1}
                >
                  {showNova ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="confirmarSenha"
                  type={showConfirmar ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={e => setConfirmarSenha(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmar(v => !v)}
                  tabIndex={-1}
                >
                  {showConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {novaSenha && confirmarSenha && novaSenha !== confirmarSenha && (
              <p className="text-xs text-destructive">As senhas não coincidem.</p>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={savingPwd || !novaSenha || novaSenha !== confirmarSenha}
            >
              {savingPwd ? 'Salvando...' : 'Alterar senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
