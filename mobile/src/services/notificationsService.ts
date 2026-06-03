import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { supabase } from '@/lib/supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function registerPushToken(): Promise<void> {
  if (Platform.OS === 'web') return

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Alertas de Estoque',
      importance: Notifications.AndroidImportance.HIGH,
    })
  }

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return

  let token: string
  try {
    const result = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })
    token = result.data
  } catch {
    return
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('push_tokens')
    .upsert({ user_id: user.id, token }, { onConflict: 'user_id,token', ignoreDuplicates: true })
}
