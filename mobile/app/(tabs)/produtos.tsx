import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TextInput, StyleSheet,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native'
import { productsService } from '@/services/productsService'

type Product = {
  id: string
  codigo: string
  nome: string
  quantidade_atual: number
  quantidade_minima: number
  unidade_medida: string
  category: { nome: string } | null
}

function getStockStatus(p: Product) {
  if (p.quantidade_atual === 0) return { label: 'Zerado', color: '#EF4444', bg: '#FEF2F2' }
  if (p.quantidade_minima > 0 && p.quantidade_atual <= p.quantidade_minima)
    return { label: 'Baixo', color: '#F59E0B', bg: '#FFFBEB' }
  return { label: 'OK', color: '#10B981', bg: '#F0FDF4' }
}

export default function ProdutosScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load(q?: string) {
    try {
      const data = await productsService.getAll(q)
      setProducts(data as Product[])
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os produtos.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const timer = setTimeout(() => load(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    load(search)
  }, [search])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.search}
          placeholder="Buscar por nome ou código..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={products}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />}
        renderItem={({ item }) => {
          const status = getStockStatus(item)
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={styles.prodNome} numberOfLines={1}>{item.nome}</Text>
                  <Text style={styles.prodCodigo}>{item.codigo} · {item.category?.nome}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
              <View style={styles.stockRow}>
                <Text style={styles.stockValue}>
                  {item.quantidade_atual} <Text style={styles.stockUnit}>{item.unidade_medida}</Text>
                </Text>
                {item.quantidade_minima > 0 && (
                  <Text style={styles.stockMin}>mín: {item.quantidade_minima}</Text>
                )}
              </View>
            </View>
          )
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum produto encontrado.</Text>
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { padding: 16, paddingBottom: 8 },
  search: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, padding: 12, fontSize: 14, color: '#111827',
  },
  card: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1, marginRight: 8 },
  prodNome: { fontSize: 15, fontWeight: '600', color: '#111827' },
  prodCodigo: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  stockRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 10, gap: 8 },
  stockValue: { fontSize: 22, fontWeight: '700', color: '#111827' },
  stockUnit: { fontSize: 13, fontWeight: '400', color: '#6B7280' },
  stockMin: { fontSize: 12, color: '#9CA3AF' },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
})
