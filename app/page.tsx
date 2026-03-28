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

export default function Home() {
  const router = useRouter()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [decision, setDecision] = useState<null | "like" | "pass">(null)
  const [slide, setSlide] = useState(0)
  const startPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const fetchIdeas = async () => {
      const { data } = await supabase.from("ideas").select("*")
      if (data) setIdeas(data)
      setLoading(false)
    }
    fetchIdeas()
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
      const direction = offset.x > 0 ? "like" : "pass"
      const idea = ideas[index]
      const field = direction === "like" ? "likes" : "passes"
      await supabase.rpc("increment", { row_id: idea.id, field_name: field })
      setOffset({ x: direction === "like" ? 600 : -600, y: offset.y })
      setTimeout(() => {
        setIndex((i) => i + 1)
        setOffset({ x: 0, y: 0 })
        setDecision(null)
      }, 300)
    } else {
      setOffset({ x: 0, y: 0 })
      setDecision(null)
    }
  }

  const swipe = async (direction: "like" | "pass") => {
    const idea = ideas[index]
    const field = direction === "like" ? "likes" : "passes"
    await supabase.rpc("increment", { row_id: idea.id, field_name: field })
    setOffset({ x: direction === "like" ? 600 : -600, y: 0 })
    setTimeout(() => {
      setIndex((i) => i + 1)
      setOffset({ x: 0, y: 0 })
      setDecision(null)
    }, 300)
  }

  const rotation = offset.x / 15
  const opacity = Math.max(0, 1 - Math.abs(offset.x) / 400)
  const slides = ["image", "detail"]

  if (loading) return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-600 text-sm">Chargement...</p>
    </main>
  )

  if (index >= ideas.length) return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
      <p className="text-4xl">🎉</p>
      <p className="text-white text-xl font-semibold">C'est tout pour l'instant</p>
      <button
        onClick={() => router.push("/submit")}
        className="bg-white text-black text-sm font-medium px-6 py-3 rounded-full hover:bg-zinc-100 transition"
      >
        Soumettre une idée
      </button>
    </main>
  )

  const idea = ideas[index]
  const nextIdea = ideas[index + 1]

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-between py-10 px-4 select-none">

      <div className="w-full max-w-sm flex items-center justify-between">
        <h1 className="text-white text-xl font-semibold tracking-tight">Swipal</h1>
        <div className="flex gap-4">
          <button onClick={() => router.push("/submit")} className="text-xs text-zinc-500 hover:text-white transition">+ Soumettre</button>
          <button onClick={() => router.push("/dashboard")} className="text-xs text-zinc-500 hover:text-white transition">Stats</button>
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center gap-4">
        <p className="text-xs text-zinc-600 tracking-widest uppercase">{ideas.length - index} idée{ideas.length - index > 1 ? "s" : ""} restante{ideas.length - index > 1 ? "s" : ""}</p>

        <div className="relative w-full" style={{ height: "460px" }}>

          {nextIdea && (
            <div className="absolute inset-0 rounded-3xl border border-zinc-800 bg-zinc-900 scale-95 opacity-50 overflow-hidden">
              {nextIdea.image_url && (
                <img src={nextIdea.image_url} alt="" className="w-full h-48 object-cover opacity-40" />
              )}
            </div>
          )}

          <div
            className="absolute inset-0 rounded-3xl border border-zinc-800 bg-zinc-900 flex flex-col overflow-hidden cursor-grab active:cursor-grabbing"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
              transition: dragging ? "none" : "transform 0.3s ease",
              opacity: dragging ? opacity : 1,
              boxShadow: "0 0 60px rgba(255,255,255,0.03)"
            }}
            onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
            onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={handleEnd}
          >
            {decision === "like" && (
              <div className="absolute top-6 left-6 z-10 border-2 border-green-400 text-green-400 font-bold text-lg px-3 py-1 rounded-lg rotate-[-15deg] opacity-90 bg-black/40">
                LIKE 👍
              </div>
            )}
            {decision === "pass" && (
              <div className="absolute top-6 right-6 z-10 border-2 border-red-400 text-red-400 font-bold text-lg px-3 py-1 rounded-lg rotate-[15deg] opacity-90 bg-black/40">
                PASS ✕
              </div>
            )}

            {slide === 0 && (
              <>
                <div className="relative w-full h-52 overflow-hidden">
                  {idea.image_url ? (
                    <img src={idea.image_url} alt={idea.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                </div>
                <div className="flex flex-col gap-3 p-6">
                  <span className="text-xs font-medium text-zinc-500 bg-zinc-800 px-3 py-1 rounded-full self-start">{idea.category || "Autre"}</span>
                  <h2 className="text-2xl font-semibold text-white leading-snug">{idea.title}</h2>
                  <p className="text-zinc-400 text-sm leading-relaxed">{idea.problem}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSlide(1) }}
                    className="text-xs text-zinc-500 hover:text-white transition mt-2 self-start"
                  >
                    En savoir plus →
                  </button>
                </div>
              </>
            )}

            {slide === 1 && (
              <div className="flex flex-col gap-4 p-6 h-full">
                <button
                  onClick={(e) => { e.stopPropagation(); setSlide(0) }}
                  className="text-xs text-zinc-500 hover:text-white transition self-start"
                >
                  ← Retour
                </button>
                <h2 className="text-xl font-semibold text-white">{idea.title}</h2>
                <div className="h-px bg-zinc-800" />
                <div className="flex flex-col gap-3">
                  <div className="bg-zinc-800 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500 mb-1">Le problème</p>
                    <p className="text-white text-sm leading-relaxed">{idea.problem}</p>
                  </div>
                  <div className="bg-zinc-800 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500 mb-1">Catégorie</p>
                    <p className="text-white text-sm">{idea.category || "Non définie"}</p>
                  </div>
                </div>
                <p className="text-zinc-600 text-xs mt-auto">Glisse pour voter 👉</p>
              </div>
            )}

            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {slides.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === slide ? "bg-white" : "bg-zinc-600"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm flex justify-center gap-6">
        <button
          onClick={() => swipe("pass")}
          className="w-16 h-16 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 text-xl hover:border-red-500 hover:text-red-400 hover:scale-105 transition-all"
        >
          ✕
        </button>
        <button
          onClick={() => swipe("like")}
          className="w-16 h-16 rounded-full bg-white text-black text-xl font-bold hover:bg-zinc-100 hover:scale-105 transition-all shadow-lg"
        >
          ♥
        </button>
      </div>

    </main>
  )
}
