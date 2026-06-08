'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Package, Truck, Tag, Loader2 } from 'lucide-react'

type SearchResult = {
  produtos: { id: string; nome: string; codigo: string; quantidade_atual: number; unidade_medida: string }[]
  fornecedores: { id: string; nome: string; cnpj: string | null }[]
  categorias: { id: string; nome: string }[]
}

export function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) { setResults(null); setLoading(false); return }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (res.ok) setResults(await res.json())
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const hasResults = results && (
    results.produtos.length > 0 || results.fornecedores.length > 0 || results.categorias.length > 0
  )
  const isEmpty = results && !hasResults

  function navigate(href: string) {
    router.push(href)
    setOpen(false)
    setQuery('')
    setResults(null)
  }

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <div className="flex items-center gap-2 bg-muted/60 border rounded-lg px-3 py-1.5 w-64 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50 transition-all">
        {loading
          ? <Loader2 className="h-4 w-4 text-muted-foreground shrink-0 animate-spin" />
          : <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        }
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar produtos, fornecedores..."
          className="bg-transparent text-sm outline-none placeholder:text-muted-foreground w-full"
        />
      </div>

      {open && query.length >= 2 && (
        <div className="absolute top-full mt-1 right-0 w-80 bg-popover border rounded-xl shadow-lg z-50 overflow-hidden">
          {loading && !results && (
            <div className="p-4 text-sm text-muted-foreground text-center">Buscando...</div>
          )}

          {isEmpty && (
            <div className="p-4 text-sm text-muted-foreground text-center">Nenhum resultado para "{query}"</div>
          )}

          {hasResults && (
            <div className="py-1 max-h-80 overflow-y-auto">
              {results.produtos.length > 0 && (
                <>
                  <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Produtos
                  </p>
                  {results.produtos.map(p => (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/produtos?search=${encodeURIComponent(p.nome)}`)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent text-left transition-colors"
                    >
                      <Package className="h-4 w-4 text-blue-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.codigo} · {p.quantidade_atual} {p.unidade_medida}
                        </p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {results.fornecedores.length > 0 && (
                <>
                  <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1">
                    Fornecedores
                  </p>
                  {results.fornecedores.map(f => (
                    <button
                      key={f.id}
                      onClick={() => navigate('/fornecedores')}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent text-left transition-colors"
                    >
                      <Truck className="h-4 w-4 text-amber-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{f.nome}</p>
                        {f.cnpj && <p className="text-xs text-muted-foreground">{f.cnpj}</p>}
                      </div>
                    </button>
                  ))}
                </>
              )}

              {results.categorias.length > 0 && (
                <>
                  <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1">
                    Categorias
                  </p>
                  {results.categorias.map(c => (
                    <button
                      key={c.id}
                      onClick={() => navigate('/categorias')}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent text-left transition-colors"
                    >
                      <Tag className="h-4 w-4 text-emerald-500 shrink-0" />
                      <p className="text-sm font-medium truncate">{c.nome}</p>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
