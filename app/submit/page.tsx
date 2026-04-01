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
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!form.title || !form.problem) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    let image_url = null

    if (image) {
      const ext = image.name.split(".").pop()
      const filename = `${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from("ideas")
        .upload(filename, image)

      if (!uploadError) {
        const { data } = supabase.storage.from("ideas").getPublicUrl(filename)
        image_url = data.publicUrl
      }
    }

    const { error } = await supabase.from("ideas").insert({
      title: form.title,
      problem: form.problem,
      category: form.category,
      anonymous: form.anonymous,
      user_id: user?.id || null,
      image_url,
    })

    if (error) {
      alert("Erreur lors de la soumission 😕")
      setLoading(false)
      return
    }

    router.push("/dashboard")
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-white text-3xl font-semibold">Soumettre une idée</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-sm flex flex-col gap-4">

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 text-xs">Photo de l'idée (optionnel)</label>
          <label className="cursor-pointer">
            {preview ? (
              <img src={preview} alt="preview" className="w-full h-40 object-cover rounded-xl" />
            ) : (
              <div className="w-full h-40 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700 border-dashed hover:border-zinc-500 transition">
                <p className="text-zinc-500 text-sm">+ Ajouter une photo</p>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </label>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 text-xs">Nom de l'idée</label>
          <input
            className="bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-zinc-600 text-sm"
            placeholder="Ex: Parkly"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 text-xs">Quel problème ça résout ?</label>
          <textarea
            className="bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-zinc-600 resize-none text-sm"
            placeholder="Ex: Trouver une place de parking en ville est un cauchemar"
            rows={3}
            value={form.problem}
            onChange={(e) => setForm({ ...form, problem: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 text-xs">Catégorie</label>
          <select
            className="bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-zinc-600 text-sm"
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
            className="w-4 h-4 accent-white"
          />
          <label htmlFor="anon" className="text-zinc-400 text-sm">Soumettre anonymement</label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-100 transition disabled:opacity-50 text-sm mt-2"
        >
          {loading ? "Envoi en cours..." : "Soumettre 🚀"}
        </button>
      </div>

      <button
        onClick={() => router.push("/")}
        className="text-zinc-600 text-xs hover:text-zinc-400 transition"
      >
        ← Retour
      </button>
    </main>
  )
}