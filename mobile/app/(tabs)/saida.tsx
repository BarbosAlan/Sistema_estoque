import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native'
import { productsService } from '@/services/productsService'
import { movementsService } from '@/services/movementsService'
import { authService } from '@/services/authService'

type Product = {
  id: string
  codigo: string
  nome: string
  quantidade_atual: number
  unidade_medida: string
}

export default function SaidaScreen() {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [selected, setSelected] = useState<Product | null>(null)
  const [quantidade, setQuantidade] = useState('')
  const [motivo, setMotivo] = useState('')
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (selected) return
    const timer = setTimeout(async () => {
      if (!search.trim()) { setProducts([]); return }
      setSearching(true)
      try {
        const data = await productsService.getAll(search)
        setProducts(data as Product[])
      } finally {
        setSearching(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [search, selected])

  function selectProduct(p: Product) {
    setSelected(p)
    setSearch(p.nome)
    setProducts([])
  }

  function clearSelection() {
    setSelected(null)
    setSearch('')
    setQuantidade('')
    setMotivo('')
    setProducts([])
  }

  async function handleSubmit() {
    if (!selected) { Alert.alert('Atenção', 'Selecione um produto.'); return }
    const qty = parseInt(quantidade)
    if (!qty || qty <= 0) { Alert.alert('Atenção', 'Informe uma quantidade válida.'); return }
    if (qty > selected.quantidade_atual) {
      Alert.alert('Estoque insuficiente', `Disponível: ${selected.quantidade_atual} ${selected.unidade_medida}`)
      return
    }

    setSubmitting(true)
    try {
      const session = await authService.getSession()
      if (!session) throw new Error('Sessão expirada')
      await movementsService.registrarSaida({
        produto_id: selected.id,
        quantidade: qty,
        motivo: motivo.trim() || undefined,
        usuario_id: session.user.id,
      })
      Alert.alert('Sucesso', `Saída de ${qty} ${selected.unidade_medida} de "${selected.nome}" registrada.`)
      clearSelection()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao registrar saída.'
      Alert.alert('Erro', msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Produto</Text>
        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Buscar produto..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={t => { setSearch(t); setSelected(null) }}
            autoCorrect={false}
          />
          {selected && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearSelection}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {searching && <ActivityIndicator size="small" color="#DC2626" style={{ marginBottom: 8 }} />}

        {!selected && products.length > 0 && (
          <View style={styles.dropdown}>
            {products.slice(0, 6).map(p => (
              <TouchableOpacity key={p.id} style={styles.dropdownItem} onPress={() => selectProduct(p)}>
                <Text style={styles.dropdownNome}>{p.nome}</Text>
                <Text style={styles.dropdownMeta}>
                  {p.codigo} · {p.quantidade_atual} {p.unidade_medida} disponíveis
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selected && (
          <View style={styles.selectedCard}>
            <Text style={styles.selectedNome}>{selected.nome}</Text>
            <Text style={styles.selectedStock}>
              Disponível: <Text style={styles.selectedStockValue}>{selected.quantidade_atual} {selected.unidade_medida}</Text>
            </Text>
          </View>
        )}

        <Text style={styles.label}>Quantidade</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor="#9CA3AF"
          value={quantidade}
          onChangeText={setQuantidade}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Motivo <Text style={styles.optional}>(opcional)</Text></Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="Ex: uso no escritório"
          placeholderTextColor="#9CA3AF"
          value={motivo}
          onChangeText={setMotivo}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Registrar Saída</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 16 },
  optional: { fontWeight: '400', color: '#9CA3AF' },
  searchWrapper: { position: 'relative' },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 8, padding: 14, fontSize: 15, color: '#111827',
  },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  clearBtn: {
    position: 'absolute', right: 14, top: 14,
  },
  clearText: { fontSize: 16, color: '#9CA3AF' },
  dropdown: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 8, marginTop: 4, overflow: 'hidden',
  },
  dropdownItem: {
    padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  dropdownNome: { fontSize: 14, fontWeight: '600', color: '#111827' },
  dropdownMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  selectedCard: {
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 8, padding: 12, marginTop: 6,
  },
  selectedNome: { fontSize: 14, fontWeight: '700', color: '#111827' },
  selectedStock: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  selectedStockValue: { fontWeight: '700', color: '#111827' },
  button: {
    backgroundColor: '#DC2626', borderRadius: 8, padding: 16,
    alignItems: 'center', marginTop: 28,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
