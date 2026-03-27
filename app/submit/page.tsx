"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Submit() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: "",
    problem: "",
    category: "",
    anonymous: false,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.title || !form.problem) return
    setLoading(true)

    const { error } = await supabase.from("ideas").insert({
      title: form.title,
      problem: form.problem,
      category: form.category,
      anonymous: form.anonymous,
    })

    if (error) {
      alert("Erreur lors de la soumission 😕")
      setLoading(false)
      return
    }

    router.push("/")
  }

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-white text-3xl font-bold">Soumettre une idée</h1>

      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-sm">Nom de l'idée</label>
          <input
            className="bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Ex: Parkly"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-sm">Quel problème ça résout ?</label>
          <textarea
            className="bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-green-500 resize-none"
            placeholder="Ex: Trouver une place de parking en ville est un cauchemar"
            rows={3}
            value={form.problem}
            onChange={(e) => setForm({ ...form, problem: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-sm">Catégorie</label>
          <select
            className="bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-green-500"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="">Choisir...</option>
            <option>Tech</option>
            <option>Food</option>
            <option>Mobilité</option>
            <option>Santé</option>
            <option>Finance</option>
            <option>Autre</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="anon"
            checked={form.anonymous}
            onChange={(e) => setForm({ ...form, anonymous: e.target.checked })}
            className="w-4 h-4 accent-green-500"
          />
          <label htmlFor="anon" className="text-gray-300 text-sm">Soumettre anonymement</label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition mt-2"
        >
          {loading ? "Envoi en cours..." : "Soumettre 🚀"}
        </button>
      </div>

      <button
        onClick={() => router.push("/")}
        className="text-gray-500 text-sm hover:text-gray-300 transition"
      >
        ← Retour
      </button>
    </main>
  )
}