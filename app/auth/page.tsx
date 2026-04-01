"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Auth() {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "signup">("signup")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async () => {
    if (!email || !password) return
    setLoading(true)
    setMessage("")

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage("Vérifie ton email pour confirmer ton compte ✅")
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
      else router.push("/")
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-white text-3xl font-semibold tracking-tight">Swipal</h1>
      <p className="text-zinc-500 text-sm">Le Tinder des idées de business</p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-sm flex flex-col gap-4">
        <div className="flex gap-2 bg-zinc-800 rounded-xl p-1">
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 text-sm py-2 rounded-lg transition font-medium ${mode === "signup" ? "bg-white text-black" : "text-zinc-400"}`}
          >
            Inscription
          </button>
          <button
            onClick={() => setMode("login")}
            className={`flex-1 text-sm py-2 rounded-lg transition font-medium ${mode === "login" ? "bg-white text-black" : "text-zinc-400"}`}
          >
            Connexion
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 text-xs">Email</label>
          <input
            type="email"
            className="bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-zinc-600 text-sm"
            placeholder="ton@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 text-xs">Mot de passe</label>
          <input
            type="password"
            className="bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-zinc-600 text-sm"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {message && (
          <p className="text-xs text-zinc-400 text-center">{message}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-100 transition disabled:opacity-50 text-sm mt-2"
        >
          {loading ? "..." : mode === "signup" ? "Créer mon compte" : "Se connecter"}
        </button>
      </div>

      <button
        onClick={() => router.push("/")}
        className="text-zinc-600 text-xs hover:text-zinc-400 transition"
      >
        Continuer sans compte →
      </button>
    </main>
  )
}