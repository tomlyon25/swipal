"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type Idea = {
  id: string
  title: string
  problem: string
  category: string
  likes: number
  passes: number
  created_at: string
}

export default function Dashboard() {
  const router = useRouter()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchIdeas = async () => {
      const { data } = await supabase
        .from("ideas")
        .select("*")
        .order("likes", { ascending: false })
      if (data) setIdeas(data)
      setLoading(false)
    }
    fetchIdeas()
  }, [])

  if (loading) return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Chargement...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center gap-6 p-6">
      <div className="w-full max-w-sm flex items-center justify-between">
        <h1 className="text-white text-2xl font-bold">Tableau de bord</h1>
        <button
          onClick={() => router.push("/")}
          className="text-gray-500 text-sm hover:text-gray-300 transition"
        >
          ← Retour
        </button>
      </div>

      {ideas.map((idea) => {
        const total = idea.likes + idea.passes
        const score = total > 0 ? Math.round((idea.likes / total) * 100) : 0

        return (
          <div key={idea.id} className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-widest">{idea.category}</span>
                <h2 className="text-white text-lg font-bold mt-1">{idea.title}</h2>
                <p className="text-gray-400 text-sm mt-1">{idea.problem}</p>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${score >= 50 ? "text-green-400" : "text-red-400"}`}>
                  {score}%
                </span>
                <p className="text-gray-500 text-xs">score</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 bg-gray-700 rounded-xl p-3 text-center">
                <p className="text-green-400 text-xl font-bold">{idea.likes}</p>
                <p className="text-gray-400 text-xs">likes</p>
              </div>
              <div className="flex-1 bg-gray-700 rounded-xl p-3 text-center">
                <p className="text-red-400 text-xl font-bold">{idea.passes}</p>
                <p className="text-gray-400 text-xs">passes</p>
              </div>
              <div className="flex-1 bg-gray-700 rounded-xl p-3 text-center">
                <p className="text-white text-xl font-bold">{total}</p>
                <p className="text-gray-400 text-xs">total</p>
              </div>
            </div>

            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        )
      })}
    </main>
  )
}