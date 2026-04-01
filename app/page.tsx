"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type Idea = {
  id: string
  title: string
  problem: string
  category: string
  image_url: string
}

const categoryColors: Record<string, string> = {
  Tech: "#6366f1",
  Food: "#f97316",
  Mobilité: "#06b6d4",
  Santé: "#22c55e",
  Finance: "#eab308",
  Autre: "#8b5cf6",
}

export default function Home() {
  const router = useRouter()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [decision, setDecision] = useState<null | "like" | "pass">(null)
  const [slide, setSlide] = useState(0)
  const [user, setUser] = useState<any>(null)
  const startPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data: allIdeas } = await supabase.from("ideas").select("*")
      if (user && allIdeas) {
        const { data: votes } = await supabase.from("votes").select("idea_id").eq("user_id", user.id)
        const votedIds = new Set(votes?.map((v) => v.idea_id) || [])
        setIdeas(allIdeas.filter((i) => !votedIds.has(i.id)))
      } else if (allIdeas) {
        setIdeas(allIdeas)
      }
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => { setSlide(0) }, [index])

  const handleStart = (clientX: number, clientY: number) => {
    setDragging(true)
    startPos.current = { x: clientX, y: clientY }
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!dragging) return
    const x = clientX - startPos.current.x
    const y = clientY - startPos.current.y
    setOffset({ x, y })
    if (x > 60) setDecision("like")
    else if (x < -60) setDecision("pass")
    else setDecision(null)
  }

  const handleEnd = async () => {
    setDragging(false)
    if (Math.abs(offset.x) > 100) {
      if (!user) { setOffset({ x: 0, y: 0 }); setDecision(null); router.push("/auth"); return }
      await doSwipe(offset.x > 0 ? "like" : "pass")
    } else {
      setOffset({ x: 0, y: 0 })
      setDecision(null)
    }
  }

  const doSwipe = async (direction: "like" | "pass") => {
    const idea = ideas[index]
    await supabase.rpc("increment", { row_id: idea.id, field_name: direction === "like" ? "likes" : "passes" })
    await supabase.from("votes").insert({ user_id: user.id, idea_id: idea.id, direction })
    setOffset({ x: direction === "like" ? 600 : -600, y: 0 })
    setTimeout(() => { setIndex((i) => i + 1); setOffset({ x: 0, y: 0 }); setDecision(null) }, 300)
  }

  const swipe = async (direction: "like" | "pass") => {
    if (!user) { router.push("/auth"); return }
    await doSwipe(direction)
  }

  const rotation = offset.x / 15
  const opacity = Math.max(0, 1 - Math.abs(offset.x) / 400)

  if (loading) return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <p className="text-zinc-600 text-sm">Chargement...</p>
      </div>
    </main>
  )

  if (index >= ideas.length) return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6">
      <div className="text-5xl">🎉</div>
      <p className="text-white text-2xl font-bold">Tu as tout vu !</p>
      <p className="text-zinc-500 text-sm">Reviens plus tard pour de nouvelles idées</p>
      <button onClick={() => router.push("/submit")} className="mt-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-8 py-3 rounded-full transition-all">
        Soumettre une idée
      </button>
    </main>
  )

  const idea = ideas[index]
  const nextIdea = ideas[index + 1]
  const color = categoryColors[idea.category] || "#8b5cf6"

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-between py-8 px-4 select-none overflow-hidden">

      <div className="w-full max-w-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #22c55e)" }}>
            <span style={{ fontSize: 16 }}>💡</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Swipal</span>
        </div>
        <div className="flex gap-3 items-center">
          {user ? (
            <button onClick={() => router.push("/dashboard")} className="text-xs text-zinc-400 hover:text-white transition bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full">
              Mes stats
            </button>
          ) : (
            <button onClick={() => router.push("/auth")} className="text-xs text-zinc-400 hover:text-white transition bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full">
              Connexion
            </button>
          )}
          <button onClick={() => router.push("/submit")} className="text-xs text-white font-semibold bg-violet-600 hover:bg-violet-500 px-3 py-1.5 rounded-full transition">
            + Soumettre
          </button>
        </div>
      </div>

      {!user && (
        <div className="w-full max-w-sm flex items-center justify-between bg-violet-950/40 border border-violet-800/30 rounded-2xl px-4 py-3">
          <p className="text-violet-300 text-xs">Connecte-toi pour voter et suivre tes idées</p>
          <button onClick={() => router.push("/auth")} className="text-xs text-violet-400 font-semibold hover:text-violet-200 transition">
            Se connecter →
          </button>
        </div>
      )}

      <div className="w-full max-w-sm flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          {ideas.slice(index, index + 5).map((_, i) => (
            <div key={i} className="h-1 rounded-full transition-all" style={{ width: i === 0 ? 24 : 8, background: i === 0 ? color : "#27272a" }} />
          ))}
        </div>

        <div className="relative w-full" style={{ height: "480px" }}>
          {nextIdea && (
            <div className="absolute inset-0 rounded-3xl overflow-hidden scale-95 opacity-60">
              {nextIdea.image_url && <img src={nextIdea.image_url} alt="" className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-black/60" />
            </div>
          )}

          <div
            className="absolute inset-0 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
              transition: dragging ? "none" : "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              opacity: dragging ? opacity : 1,
              boxShadow: decision === "like" ? "0 0 40px rgba(34,197,94,0.3)" : decision === "pass" ? "0 0 40px rgba(239,68,68,0.3)" : "0 25px 50px rgba(0,0,0,0.8)"
            }}
            onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
            onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={handleEnd}
          >
            {idea.image_url ? (
              <img src={idea.image_url} alt={idea.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${color}22, ${color}44)` }} />
            )}

            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.1) 100%)" }} />

            {decision === "like" && (
              <div className="absolute top-6 left-6 border-2 border-green-400 text-green-400 font-black text-xl px-4 py-2 rounded-xl bg-black/50 backdrop-blur-sm" style={{ transform: "rotate(-15deg)" }}>
                LIKE 👍
              </div>
            )}
            {decision === "pass" && (
              <div className="absolute top-6 right-6 border-2 border-red-400 text-red-400 font-black text-xl px-4 py-2 rounded-xl bg-black/50 backdrop-blur-sm" style={{ transform: "rotate(15deg)" }}>
                PASS ✕
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: color + "33", color: color, border: `1px solid ${color}66` }}>
                  {idea.category || "Autre"}
                </span>
              </div>
              <h2 className="text-white text-3xl font-black leading-tight">{idea.title}</h2>
              <p className="text-zinc-300 text-sm leading-relaxed">{idea.problem}</p>

              {slide === 0 && (
                <button onClick={(e) => { e.stopPropagation(); setSlide(1) }} className="text-xs text-zinc-400 hover:text-white transition self-start mt-1">
                  En savoir plus →
                </button>
              )}

              {slide === 1 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex flex-col gap-2 mt-1">
                  <p className="text-zinc-300 text-xs leading-relaxed">{idea.problem}</p>
                  <button onClick={(e) => { e.stopPropagation(); setSlide(0) }} className="text-xs text-zinc-400 hover:text-white transition self-start">
                    ← Réduire
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm flex justify-center items-center gap-8">
        <button
          onClick={() => swipe("pass")}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 border-zinc-700 bg-zinc-900 hover:border-red-500 hover:bg-red-500/10 hover:scale-110 transition-all"
        >
          ✕
        </button>
        <button
          onClick={() => swipe("like")}
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl bg-violet-600 hover:bg-violet-500 hover:scale-110 transition-all shadow-lg shadow-violet-900/50"
        >
          ♥
        </button>
        <button
          onClick={() => router.push("/submit")}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 border-zinc-700 bg-zinc-900 hover:border-violet-500 hover:bg-violet-500/10 hover:scale-110 transition-all"
        >
          +
        </button>
      </div>

    </main>
  )
}