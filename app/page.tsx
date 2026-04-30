"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"

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
  const [swiping, setSwiping] = useState(false)
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
    if (swiping) return
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
    if (swiping) return
    setSwiping(true)
    const idea = ideas[index]
    await supabase.rpc("increment", { row_id: idea.id, field_name: direction === "like" ? "likes" : "passes" })
    await supabase.from("votes").insert({ user_id: user.id, idea_id: idea.id, direction })
    setOffset({ x: direction === "like" ? 800 : -800, y: 0 })
    setTimeout(() => {
      setIndex((i) => i + 1)
      setOffset({ x: 0, y: 0 })
      setDecision(null)
      setSwiping(false)
    }, 400)
  }

  const swipe = async (direction: "like" | "pass") => {
    if (!user) { router.push("/auth"); return }
    await doSwipe(direction)
  }

  const rotation = offset.x / 12
  const likeOpacity = Math.min(1, Math.max(0, offset.x / 100))
  const passOpacity = Math.min(1, Math.max(0, -offset.x / 100))

  if (loading) return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent"
        />
        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-zinc-500 text-sm"
        >
          Chargement des idées...
        </motion.p>
      </motion.div>
    </main>
  )

  if (index >= ideas.length) return (
    <main className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-6 px-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="text-7xl"
      >
        🎉
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center gap-3"
      >
        <p className="text-white text-2xl font-black">Tu as tout vu !</p>
        <p className="text-zinc-500 text-sm text-center">Reviens plus tard pour de nouvelles idées</p>
      </motion.div>
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push("/submit")}
        className="bg-violet-600 text-white text-sm font-semibold px-8 py-3 rounded-full"
      >
        Soumettre une idée →
      </motion.button>
    </main>
  )

  const idea = ideas[index]
  const nextIdea = ideas[index + 1]
  const color = categoryColors[idea.category] || "#8b5cf6"

  return (
    <main className="min-h-screen bg-[#080808] flex flex-col items-center justify-between py-8 px-4 select-none overflow-hidden">

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7c3aed, #22c55e)" }}
          >
            <span style={{ fontSize: 18 }}>💡</span>
          </motion.div>
          <span className="text-white font-black text-xl tracking-tight">Swipal</span>
        </div>
        <div className="flex gap-2 items-center">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/leaderboard")}
            className="text-xs text-zinc-400 hover:text-white transition bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full"
          >
            🏆 Top
          </motion.button>
          {user ? (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/dashboard")}
              className="text-xs text-zinc-400 hover:text-white transition bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full"
            >
              Mes stats
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/auth")}
              className="text-xs text-zinc-400 hover:text-white transition bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full"
            >
              Connexion
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/submit")}
            className="text-xs text-white font-semibold bg-violet-600 hover:bg-violet-500 px-3 py-1.5 rounded-full transition"
          >
            + Soumettre
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-sm flex items-center justify-between bg-violet-950/40 border border-violet-800/30 rounded-2xl px-4 py-3"
          >
            <p className="text-violet-300 text-xs">Connecte-toi pour voter</p>
            <button onClick={() => router.push("/auth")} className="text-xs text-violet-400 font-semibold hover:text-violet-200 transition">
              Se connecter →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-sm flex flex-col items-center gap-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          {ideas.slice(index, index + 6).map((_, i) => (
            <motion.div
              key={i}
              layout
              className="h-1 rounded-full"
              animate={{ width: i === 0 ? 28 : 8, background: i === 0 ? color : "#27272a" }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </motion.div>

        <div className="relative w-full" style={{ height: "490px" }}>
          {nextIdea && (
            <motion.div
              initial={{ scale: 0.92, opacity: 0.5 }}
              animate={{ scale: 0.94, opacity: 0.65 }}
              className="absolute inset-0 rounded-3xl overflow-hidden"
            >
              {nextIdea.image_url && <img src={nextIdea.image_url} alt="" className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-black/65" />
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={idea.id}
              className="absolute inset-0 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing"
              style={{
                x: offset.x,
                y: offset.y,
                rotate: rotation,
                boxShadow: decision === "like"
                  ? "0 0 60px rgba(34,197,94,0.4), 0 25px 50px rgba(0,0,0,0.8)"
                  : decision === "pass"
                  ? "0 0 60px rgba(239,68,68,0.4), 0 25px 50px rgba(0,0,0,0.8)"
                  : "0 30px 60px rgba(0,0,0,0.9)",
                transition: dragging ? "box-shadow 0.1s" : "x 0.4s cubic-bezier(0.34,1.56,0.64,1), y 0.4s, rotate 0.4s, box-shadow 0.2s",
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
                <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${color}22, ${color}55)` }} />
              )}

              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.05) 100%)" }} />

              <motion.div
                className="absolute top-6 left-6 border-2 border-green-400 text-green-400 font-black text-xl px-4 py-2 rounded-xl bg-black/60 backdrop-blur-sm"
                style={{ rotate: -15, opacity: likeOpacity }}
              >
                LIKE 👍
              </motion.div>

              <motion.div
                className="absolute top-6 right-6 border-2 border-red-400 text-red-400 font-black text-xl px-4 py-2 rounded-xl bg-black/60 backdrop-blur-sm"
                style={{ rotate: 15, opacity: passOpacity }}
              >
                PASS ✕
              </motion.div>

              <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-3">
                <motion.span
                  layout
                  className="text-xs font-bold px-3 py-1 rounded-full self-start"
                  style={{ background: color + "33", color, border: `1px solid ${color}66` }}
                >
                  {idea.category || "Autre"}
                </motion.span>

                <motion.h2
                  layout
                  className="text-white leading-tight font-black"
                  style={{ fontSize: idea.title.length > 15 ? 24 : 32 }}
                >
                  {idea.title}
                </motion.h2>

                <p className="text-zinc-300 text-sm leading-relaxed">{idea.problem}</p>

                <AnimatePresence mode="wait">
                  {slide === 0 ? (
                    <motion.button
                      key="more"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={(e) => { e.stopPropagation(); setSlide(1) }}
                      className="text-xs text-zinc-400 hover:text-white transition self-start mt-1"
                    >
                      En savoir plus →
                    </motion.button>
                  ) : (
                    <motion.div
                      key="detail"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-2"
                    >
                      <p className="text-zinc-200 text-xs leading-relaxed">{idea.problem}</p>
                      <button onClick={(e) => { e.stopPropagation(); setSlide(0) }} className="text-xs text-zinc-400 hover:text-white transition self-start">
                        ← Réduire
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-sm flex justify-center items-center gap-8"
      >
        <motion.button
          whileHover={{ scale: 1.15, borderColor: "#ef4444" }}
          whileTap={{ scale: 0.9 }}
          onClick={() => swipe("pass")}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 border-zinc-700 bg-zinc-900"
        >
          ✕
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => swipe("like")}
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl bg-violet-600 shadow-lg shadow-violet-900/60"
          animate={{
            boxShadow: ["0 0 20px rgba(124,58,237,0.3)", "0 0 40px rgba(124,58,237,0.6)", "0 0 20px rgba(124,58,237,0.3)"]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ♥
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.15, borderColor: "#7c3aed" }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push("/submit")}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 border-zinc-700 bg-zinc-900"
        >
          +
        </motion.button>
      </motion.div>

    </main>
  )
}
