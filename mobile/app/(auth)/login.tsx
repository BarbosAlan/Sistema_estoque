import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native'
import { authService } from '@/services/authService'

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Preencha usuário e senha.')
      return
    }
    setLoading(true)
    try {
      await authService.signIn(identifier.trim(), password)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      Alert.alert(
        'Erro',
        msg === 'Usuário não encontrado' ? 'Usuário não encontrado.' : 'Usuário ou senha incorretos.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <View style={styles.logoDot} />
        </View>

        <Text style={styles.title}>Sistema de Estoque</Text>
        <Text style={styles.subtitle}>Entre com seu usuário ou e-mail</Text>

        <TextInput
          style={styles.input}
          placeholder="Usuário ou e-mail"
          placeholderTextColor="#9CA3AF"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoDot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DC2626',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
