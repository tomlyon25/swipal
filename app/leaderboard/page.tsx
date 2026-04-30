"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type Idea = {
  id: string
  title: string
  problem: string
  category: string
  image_url: string
  likes: number
  passes: number
}

const categoryColors: Record<string, string> = {
  Tech: "#6366f1",
  Food: "#f97316",
  Mobilité: "#06b6d4",
  Santé: "#22c55e",
  Finance: "#eab308",
  Autre: "#8b5cf6",
}

const medals = ["🥇", "🥈", "🥉"]

export default function Leaderboard() {
  const router = useRouter()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalVotes, setTotalVotes] = useState(0)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    const { data } = await supabase
      .from("ideas")
      .select("*")
      .order("likes", { ascending: false })

    if (data) {
      setIdeas(data)
      setTotal(data.length)
      setTotalVotes(data.reduce((acc, i) => acc + i.likes + i.passes, 0))
    }
    setLoading(false)
  }

  if (loading) return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
    </main>
  )

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center gap-6 pb-12 px-4">

      <div className="w-full max-w-sm pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #22c55e)" }}>
            <span style={{ fontSize: 16 }}>💡</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Swipal</span>
        </div>
        <button onClick={() => router.push("/")} className="text-xs text-zinc-500 hover:text-white transition">
          ← Retour
        </button>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-2">
        <h1 className="text-white text-2xl font-black">🏆 Classement</h1>
        <p className="text-zinc-500 text-sm">Les idées les mieux notées par la communauté</p>
      </div>

      <div className="w-full max-w-sm grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-1">
          <p className="text-3xl font-black text-violet-400">{total}</p>
          <p className="text-zinc-500 text-xs">idées soumises</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-1">
          <p className="text-3xl font-black text-green-400">{totalVotes}</p>
          <p className="text-zinc-500 text-xs">votes au total</p>
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3">
        {ideas.map((idea, i) => {
          const total = idea.likes + idea.passes
          const score = total > 0 ? Math.round((idea.likes / total) * 100) : 0
          const color = categoryColors[idea.category] || "#8b5cf6"
          const isTop3 = i < 3

          return (
            <div
              key={idea.id}
              className="relative overflow-hidden rounded-2xl border transition-all"
              style={{
                borderColor: isTop3 ? color + "44" : "#27272a",
                background: isTop3 ? color + "11" : "#18181b",
              }}
            >
              {idea.image_url && isTop3 && (
                <div className="absolute inset-0 opacity-10">
                  <img src={idea.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="relative p-4 flex items-center gap-4">
                <div className="text-2xl w-8 text-center flex-shrink-0">
                  {i < 3 ? medals[i] : <span className="text-zinc-600 text-sm font-bold">#{i + 1}</span>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: color + "22", color }}>
                      {idea.category}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-sm truncate">{idea.title}</h3>
                  <p className="text-zinc-500 text-xs truncate mt-0.5">{idea.problem}</p>
                </div>

                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                  <div
                    className="text-xl font-black"
                    style={{ color: score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444" }}
                  >
                    {score}%
                  </div>
                  <div className="text-zinc-600 text-xs">{total} votes</div>
                </div>
              </div>

              <div className="px-4 pb-3">
                <div className="w-full bg-zinc-800 rounded-full h-1">
                  <div
                    className="h-1 rounded-full transition-all duration-1000"
                    style={{ width: `${score}%`, background: score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444" }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => router.push("/")}
        className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-8 py-3 rounded-full transition-all"
      >
        Voter pour les idées →
      </button>

    </main>
  )
}
