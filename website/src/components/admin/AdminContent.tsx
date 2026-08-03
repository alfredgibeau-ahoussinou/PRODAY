"use client";

import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminMockBadge } from "@/components/admin/adminUi";
import { Plus, Edit, Trash2, Eye, MessageSquare, FileText, Image as ImageIcon, Save, X } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  published: boolean;
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  published: boolean;
}

const mockFAQ: FAQItem[] = [
  {
    id: "1",
    question: "Comment fonctionne ProDay ?",
    answer: "ProDay est une plateforme qui connecte les acteurs du football...",
    category: "Général",
    published: true,
  },
  {
    id: "2",
    question: "L'inscription est-elle gratuite ?",
    answer: "Oui, l'inscription de base est gratuite. Des options premium sont disponibles.",
    category: "Tarifs",
    published: true,
  },
];

const mockTestimonials: Testimonial[] = [
  {
    id: "1",
    name: "Thomas L.",
    role: "Joueur",
    content: "ProDay m'a permis de me faire repérer par plusieurs clubs.",
    rating: 5,
    published: true,
  },
  {
    id: "2",
    name: "Sophie M.",
    role: "Coach",
    content: "Excellente plateforme pour gérer mon équipe et trouver des talents.",
    rating: 4,
    published: false,
  },
];

export function AdminContent() {
  const [activeTab, setActiveTab] = useState<"faq" | "testimonials">("faq");
  const [faq, setFaq] = useState<FAQItem[]>(mockFAQ);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(mockTestimonials);
  const [editingItem, setEditingItem] = useState<FAQItem | Testimonial | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handlePublish = (id: string, type: "faq" | "testimonials") => {
    if (type === "faq") {
      setFaq((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, published: !item.published } : item
        )
      );
    } else {
      setTestimonials((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, published: !item.published } : item
        )
      );
    }
  };

  const handleDelete = (id: string, type: "faq" | "testimonials") => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) return;
    
    if (type === "faq") {
      setFaq((prev) => prev.filter((item) => item.id !== id));
    } else {
      setTestimonials((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleSave = (item: FAQItem | Testimonial) => {
    if (activeTab === "faq") {
      if (isCreating) {
        setFaq((prev) => [...prev, item as FAQItem]);
      } else {
        setFaq((prev) =>
          prev.map((i) => (i.id === item.id ? item as FAQItem : i))
        );
      }
    } else {
      if (isCreating) {
        setTestimonials((prev) => [...prev, item as Testimonial]);
      } else {
        setTestimonials((prev) =>
          prev.map((i) => (i.id === item.id ? item as Testimonial : i))
        );
      }
    }
    setEditingItem(null);
    setIsCreating(false);
  };

  return (
    <AdminShell
      title="Contenu"
      subtitle="FAQ, témoignages et médias du site. Hook: CRUD /api/admin/content."
      actions={<AdminMockBadge />}
    >

      {/* Onglets */}
      <section className="mt-8 flex gap-2">
        <button
          onClick={() => setActiveTab("faq")}
          className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide transition ${
            activeTab === "faq"
              ? "bg-white text-black"
              : "bg-white/[0.06] text-white/60 hover:text-white"
          }`}
        >
          FAQ
        </button>
        <button
          onClick={() => setActiveTab("testimonials")}
          className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide transition ${
            activeTab === "testimonials"
              ? "bg-white text-black"
              : "bg-white/[0.06] text-white/60 hover:text-white"
          }`}
        >
          Témoignages
        </button>
      </section>

      {/* Actions */}
      <section className="mt-6 flex justify-end">
        <button
          onClick={() => {
            setIsCreating(true);
            setEditingItem(
              activeTab === "faq"
                ? { id: "", question: "", answer: "", category: "Général", published: false }
                : { id: "", name: "", role: "", content: "", rating: 5, published: false }
            );
          }}
          className="flex items-center gap-2 rounded-full bg-[#0054F0] px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#2a6fff]"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </section>

      {/* Formulaire d'édition/création */}
      {editingItem && (
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-white">
              {isCreating ? "Créer" : "Modifier"} {activeTab === "faq" ? "une FAQ" : "un témoignage"}
            </h3>
            <button
              onClick={() => {
                setEditingItem(null);
                setIsCreating(false);
              }}
              className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {activeTab === "faq" ? (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Question</label>
                <input
                  type="text"
                  value={(editingItem as FAQItem).question}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, question: e.target.value } as FAQItem)
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Réponse</label>
                <textarea
                  value={(editingItem as FAQItem).answer}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, answer: e.target.value } as FAQItem)
                  }
                  rows={4}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Catégorie</label>
                <input
                  type="text"
                  value={(editingItem as FAQItem).category}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, category: e.target.value } as FAQItem)
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Nom</label>
                <input
                  type="text"
                  value={(editingItem as Testimonial).name}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, name: e.target.value } as Testimonial)
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Rôle</label>
                <input
                  type="text"
                  value={(editingItem as Testimonial).role}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, role: e.target.value } as Testimonial)
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Témoignage</label>
                <textarea
                  value={(editingItem as Testimonial).content}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, content: e.target.value } as Testimonial)
                  }
                  rows={4}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Note</label>
                <select
                  value={(editingItem as Testimonial).rating}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, rating: parseInt(e.target.value) } as Testimonial)
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} étoile{rating > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={() => {
                setEditingItem(null);
                setIsCreating(false);
              }}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white/70 transition hover:bg-white/10"
            >
              Annuler
            </button>
            <button
              onClick={() => handleSave(editingItem)}
              className="flex items-center gap-2 rounded-full bg-[#0054F0] px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#2a6fff]"
            >
              <Save size={16} />
              Enregistrer
            </button>
          </div>
        </section>
      )}

      {/* Liste des éléments */}
      <section className="mt-8 space-y-4">
        {activeTab === "faq" ? (
          faq.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/70">
                      {item.category}
                    </span>
                    {!item.published && (
                      <span className="inline-flex rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                        Brouillon
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-white">{item.question}</h3>
                  <p className="mt-2 text-sm text-white/70">{item.answer}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePublish(item.id, "faq")}
                    className={`rounded-full p-2 transition ${
                      item.published
                        ? "text-green-400 hover:bg-green-500/20"
                        : "text-white/40 hover:bg-white/10"
                    }`}
                    title={item.published ? "Dépublier" : "Publier"}
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setIsCreating(false);
                    }}
                    className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                    title="Modifier"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, "faq")}
                    className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-red-400"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          testimonials.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < item.rating ? "text-yellow-400" : "text-white/20"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    {!item.published && (
                      <span className="inline-flex rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                        Brouillon
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{item.name}</h3>
                    <span className="text-sm text-white/60">· {item.role}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/70">{item.content}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePublish(item.id, "testimonials")}
                    className={`rounded-full p-2 transition ${
                      item.published
                        ? "text-green-400 hover:bg-green-500/20"
                        : "text-white/40 hover:bg-white/10"
                    }`}
                    title={item.published ? "Dépublier" : "Publier"}
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setIsCreating(false);
                    }}
                    className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                    title="Modifier"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, "testimonials")}
                    className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-red-400"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </AdminShell>
  );
}
