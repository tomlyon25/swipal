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
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data } = await supabase
          .from("ideas")
          .select("*")
          .eq("user_id", user.id)
          .order("likes", { ascending: false })
        if (data) setIdeas(data)
      } else {
        const { data } = await supabase
          .from("ideas")
          .select("*")
          .order("likes", { ascending: false })
        if (data) setIdeas(data)
      }
      setLoading(false)
    }
    init()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-600 text-sm">Chargement...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-black flex flex-col items-center gap-6 p-6">
      <div className="w-full max-w-sm flex items-center justify-between">
        <h1 className="text-white text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-3 items-center">
          {user ? (
            <>
              <span className="text-zinc-600 text-xs">{user.email}</span>
              <button onClick={signOut} className="text-xs text-zinc-500 hover:text-white transition">Déconnexion</button>
            </>
          ) : (
            <button onClick={() => router.push("/auth")} className="text-xs text-zinc-500 hover:text-white transition">Se connecter</button>
          )}
          <button onClick={() => router.push("/")} className="text-zinc-500 text-sm hover:text-white transition">← Retour</button>
        </div>
      </div>

      {!user && (
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
          <p className="text-zinc-400 text-sm mb-3">Connecte-toi pour voir uniquement tes idées</p>
          <button
            onClick={() => router.push("/auth")}
            className="bg-white text-black text-sm font-medium px-4 py-2 rounded-full hover:bg-zinc-100 transition"
          >
            Se connecter
          </button>
        </div>
      )}

      {ideas.length === 0 ? (
        <div className="w-full max-w-sm text-center mt-10">
          <p className="text-zinc-500 text-sm mb-4">Aucune idée soumise pour l'instant</p>
          <button
            onClick={() => router.push("/submit")}
            className="bg-white text-black text-sm font-medium px-6 py-3 rounded-full hover:bg-zinc-100 transition"
          >
            Soumettre une idée
          </button>
        </div>
      ) : (
        ideas.map((idea) => {
          const total = idea.likes + idea.passes
          const score = total > 0 ? Math.round((idea.likes / total) * 100) : 0

          return (
            <div key={idea.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-3 py-1 rounded-full">{idea.category}</span>
                  <h2 className="text-white text-lg font-semibold mt-2">{idea.title}</h2>
                  <p className="text-zinc-500 text-sm mt-1">{idea.problem}</p>
                </div>
                <div className="text-right ml-4">
                  <span className={`text-2xl font-bold ${score >= 50 ? "text-green-400" : "text-red-400"}`}>
                    {score}%
                  </span>
                  <p className="text-zinc-600 text-xs">score</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 bg-zinc-800 rounded-xl p-3 text-center">
                  <p className="text-green-400 text-xl font-bold">{idea.likes}</p>
                  <p className="text-zinc-500 text-xs">likes</p>
                </div>
                <div className="flex-1 bg-zinc-800 rounded-xl p-3 text-center">
                  <p className="text-red-400 text-xl font-bold">{idea.passes}</p>
                  <p className="text-zinc-500 text-xs">passes</p>
                </div>
                <div className="flex-1 bg-zinc-800 rounded-xl p-3 text-center">
                  <p className="text-white text-xl font-bold">{total}</p>
                  <p className="text-zinc-500 text-xs">total</p>
                </div>
              </div>

              <div className="w-full bg-zinc-800 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          )
        })
      )}
    </main>
  )
}