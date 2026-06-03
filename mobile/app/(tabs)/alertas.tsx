import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  ActivityIndicator, Alert,
} from 'react-native'
import { alertsService, type AlertProduct } from '@/services/alertsService'

export default function AlertasScreen() {
  const [alertas, setAlertas] = useState<AlertProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    try {
      const data = await alertsService.getAlertas()
      setAlertas(data)
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os alertas.')
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    )
  }

  if (alertas.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>✓</Text>
        <Text style={styles.emptyTitle}>Tudo em ordem!</Text>
        <Text style={styles.emptyText}>
          Nenhum produto com estoque baixo ou zerado.
        </Text>
      </View>
    )
  }

  return (
    <FlatList
      style={styles.container}
      data={alertas}
      keyExtractor={item => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />
      }
      ListHeaderComponent={
        <Text style={styles.header}>
          {alertas.length} produto{alertas.length > 1 ? 's' : ''} precisando de atenção
        </Text>
      }
      renderItem={({ item }) => {
        const color = item.tipo === 'zerado' ? '#EF4444' : '#F59E0B'
        const label = item.tipo === 'zerado' ? 'Zerado' : 'Baixo'
        return (
          <View style={styles.card}>
            <View style={[styles.badge, { backgroundColor: color + '20' }]}>
              <Text style={[styles.badgeText, { color }]}>{label}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.nome} numberOfLines={1}>{item.nome}</Text>
              <Text style={styles.meta}>
                {item.codigo}{item.category ? ` · ${item.category.nome}` : ''}
              </Text>
              <Text style={styles.qty}>
                {item.quantidade_atual} / {item.quantidade_minima} {item.unidade_medida}
              </Text>
            </View>
          </View>
        )
      }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, color: '#10B981', marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  header: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 10, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  badge: {
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
    marginRight: 12, alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  info: { flex: 1 },
  nome: { fontSize: 15, fontWeight: '600', color: '#111827' },
  meta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  qty: { fontSize: 13, color: '#374151', marginTop: 4, fontWeight: '500' },
})
