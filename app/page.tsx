"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type Idea = {
  id: string
  title: string
  problem: string
  category: string
}

export default function Home() {
  const router = useRouter()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchIdeas = async () => {
      const { data } = await supabase.from("ideas").select("*")
      if (data) setIdeas(data)
      setLoading(false)
    }
    fetchIdeas()
  }, [])

  const swipe = async (direction: "like" | "pass") => {
    const idea = ideas[index]
    const field = direction === "like" ? "likes" : "passes"

    await supabase.rpc("increment", { row_id: idea.id, field_name: field })

    setResult(direction === "like" ? "👍 Bonne idée !" : "👎 Pas convaincu")
    setTimeout(() => {
      setResult(null)
      setIndex((i) => i + 1)
    }, 800)
  }

  if (loading) return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Chargement...</p>
    </main>
  )

  if (index >= ideas.length) return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
      <p className="text-white text-2xl font-bold">C'est tout pour l'instant 🎉</p>
      <button
        onClick={() => router.push("/submit")}
        className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition"
      >
        Soumettre une idée
      </button>
    </main>
  )

  const idea = ideas[index]

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-8 p-4">
      <h1 className="text-white text-3xl font-bold">Swipal</h1>

      <button
        onClick={() => router.push("/submit")}
        className="text-green-400 text-sm hover:text-green-300 transition"
      >
        + Soumettre une idée
      </button>

      <button
        onClick={() => router.push("/dashboard")}
        className="text-gray-400 text-sm hover:text-gray-300 transition"
      >
        📊 Voir les stats
      </button>
      
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm shadow-xl flex flex-col gap-4">
        <span className="text-xs text-gray-400 uppercase tracking-widest">{idea.category}</span>
        <h2 className="text-white text-2xl font-bold">{idea.title}</h2>
        <p className="text-gray-300 text-base">{idea.problem}</p>
      </div>

      {result && (
        <div className="text-2xl font-bold text-white animate-pulse">{result}</div>
      )}

      <div className="flex gap-6">
        <button
          onClick={() => swipe("pass")}
          className="bg-red-500 hover:bg-red-600 text-white text-xl font-bold w-16 h-16 rounded-full transition"
        >
          ✕
        </button>
        <button
          onClick={() => swipe("like")}
          className="bg-green-500 hover:bg-green-600 text-white text-xl font-bold w-16 h-16 rounded-full transition"
        >
          ♥
        </button>
      </div>
    </main>
  )
}
