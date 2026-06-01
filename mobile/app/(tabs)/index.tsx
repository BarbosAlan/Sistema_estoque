import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native'
import { productsService } from '@/services/productsService'
import { movementsService } from '@/services/movementsService'
import { authService } from '@/services/authService'
import { supabase } from '@/lib/supabase'

type Summary = { total: number; zerados: number; criticos: number }
type Movement = {
  id: string
  tipo: string
  quantidade: number
  motivo: string | null
  criado_em: string
  produto: { nome: string; codigo: string } | null
}

const TIPO_LABEL: Record<string, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste_entrada: 'Ajuste +',
  ajuste_saida: 'Ajuste -',
}

const TIPO_COLOR: Record<string, string> = {
  entrada: '#10B981',
  saida: '#EF4444',
  ajuste_entrada: '#10B981',
  ajuste_saida: '#EF4444',
}

export default function HomeScreen() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [movements, setMovements] = useState<Movement[]>([])
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    try {
      const session = await authService.getSession()
      if (session?.user) {
        const profile = await authService.getProfile(session.user.id)
        setNome(profile?.nome ?? '')
      }
      const [s, m] = await Promise.all([
        productsService.getSummary(),
        movementsService.getRecentes(8),
      ])
      setSummary(s)
      setMovements(m as Movement[])
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os dados.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    load()
  }, [])

  async function handleLogout() {
    await authService.signOut()
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    )
  }

  return (
    <FlatList
      style={styles.container}
      data={movements}
      keyExtractor={item => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />}
      ListHeaderComponent={
        <View>
          <View style={styles.greetingRow}>
            <Text style={styles.greeting}>Olá, {nome || 'usuário'}</Text>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.logoutText}>Sair</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderLeftColor: '#6366F1' }]}>
              <Text style={styles.statValue}>{summary?.total ?? 0}</Text>
              <Text style={styles.statLabel}>Produtos ativos</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
              <Text style={styles.statValue}>{summary?.criticos ?? 0}</Text>
              <Text style={styles.statLabel}>Estoque baixo</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: '#EF4444' }]}>
              <Text style={styles.statValue}>{summary?.zerados ?? 0}</Text>
              <Text style={styles.statLabel}>Zerados</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Últimas movimentações</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.movRow}>
          <View style={[styles.tipoTag, { backgroundColor: TIPO_COLOR[item.tipo] + '20' }]}>
            <Text style={[styles.tipoText, { color: TIPO_COLOR[item.tipo] }]}>
              {TIPO_LABEL[item.tipo] ?? item.tipo}
            </Text>
          </View>
          <View style={styles.movInfo}>
            <Text style={styles.movNome} numberOfLines={1}>
              {item.produto?.nome ?? '—'}
            </Text>
            <Text style={styles.movMeta}>
              {item.quantidade} un {item.motivo ? `· ${item.motivo}` : ''}
            </Text>
          </View>
          <Text style={styles.movData}>
            {new Date(item.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </Text>
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>Nenhuma movimentação registrada.</Text>
      }
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  greetingRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  greeting: { fontSize: 20, fontWeight: '700', color: '#111827' },
  logoutText: { fontSize: 14, color: '#DC2626', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 12,
  },
  movRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 10, padding: 12, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  tipoTag: {
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginRight: 10,
  },
  tipoText: { fontSize: 11, fontWeight: '700' },
  movInfo: { flex: 1 },
  movNome: { fontSize: 14, fontWeight: '600', color: '#111827' },
  movMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  movData: { fontSize: 12, color: '#9CA3AF', marginLeft: 8 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 24 },
})
