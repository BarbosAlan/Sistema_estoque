import { Loader2 } from 'lucide-react'

export default function LoginLoading() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>Carregando...</span>
    </div>
  )
}
