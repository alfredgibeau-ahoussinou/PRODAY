"use client";

import { useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { Plus, Edit, Trash2, Eye, Save, X, Layers, Check, X as XIcon } from "lucide-react";

interface Pole {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  active: boolean;
  order: number;
}

interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
  poles: string[];
  active: boolean;
}

const mockPoles: Pole[] = [
  {
    id: "joueur",
    name: "Joueur",
    description: "Pour les footballeurs et joueuses",
    color: "#4C8BFF",
    icon: "⚽",
    active: true,
    order: 1,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Pour les coachs, recruteurs, clubs",
    color: "#006CFC",
    icon: "👔",
    active: true,
    order: 2,
  },
  {
    id: "sante",
    name: "Santé",
    description: "Pour les professionnels de santé",
    color: "#00CCB4",
    icon: "🏥",
    active: true,
    order: 3,
  },
  {
    id: "partenaires",
    name: "Partenaires",
    description: "Pour les sponsors et marques",
    color: "#D4AF37",
    icon: "🤝",
    active: true,
    order: 4,
  },
  {
    id: "supporter",
    name: "Supporter",
    description: "Pour les passionnés de foot",
    color: "#3C00F0",
    icon: "🎉",
    active: true,
    order: 5,
  },
];

const mockFeatures: Feature[] = [
  {
    id: "profile",
    name: "Profil personnalisé",
    description: "Création et gestion du profil utilisateur",
    category: "Base",
    poles: ["joueur", "pro", "sante", "partenaires", "supporter"],
    active: true,
  },
  {
    id: "stats",
    name: "Stats de match",
    description: "Suivi des performances et statistiques",
    category: "Performance",
    poles: ["joueur", "pro"],
    active: true,
  },
  {
    id: "mercato",
    name: "Mercato & recrutement",
    description: "Annonces et candidatures de recrutement",
    category: "Recrutement",
    poles: ["joueur", "pro"],
    active: true,
  },
  {
    id: "covoiturage",
    name: "Covoiturage",
    description: "Organisation de trajets partagés",
    category: "Logistique",
    poles: ["joueur", "pro"],
    active: true,
  },
];

export function AdminPoles() {
  const [activeTab, setActiveTab] = useState<"poles" | "features">("poles");
  const [poles, setPoles] = useState<Pole[]>(mockPoles);
  const [features, setFeatures] = useState<Feature[]>(mockFeatures);
  const [editingItem, setEditingItem] = useState<Pole | Feature | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleToggleActive = (id: string, type: "poles" | "features") => {
    if (type === "poles") {
      setPoles((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, active: !item.active } : item
        )
      );
    } else {
      setFeatures((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, active: !item.active } : item
        )
      );
    }
  };

  const handleDelete = (id: string, type: "poles" | "features") => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) return;
    
    if (type === "poles") {
      setPoles((prev) => prev.filter((item) => item.id !== id));
    } else {
      setFeatures((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleSave = (item: Pole | Feature) => {
    if (activeTab === "poles") {
      if (isCreating) {
        setPoles((prev) => [...prev, item as Pole]);
      } else {
        setPoles((prev) =>
          prev.map((i) => (i.id === item.id ? item as Pole : i))
        );
      }
    } else {
      if (isCreating) {
        setFeatures((prev) => [...prev, item as Feature]);
      } else {
        setFeatures((prev) =>
          prev.map((i) => (i.id === item.id ? item as Feature : i))
        );
      }
    }
    setEditingItem(null);
    setIsCreating(false);
  };

  const toggleFeaturePole = (featureId: string, poleId: string) => {
    setFeatures((prev) =>
      prev.map((feature) =>
        feature.id === featureId
          ? {
              ...feature,
              poles: feature.poles.includes(poleId)
                ? feature.poles.filter((p) => p !== poleId)
                : [...feature.poles, poleId],
            }
          : feature
      )
    );
  };

  return (
    <main className="relative mx-auto w-full max-w-7xl px-6 py-12">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-[0.22em] text-[#4C8BFF]">
            Admin · Pôles
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
            Gestion des pôles et fonctionnalités
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/55">
            Configurez les pôles ProDay et leurs fonctionnalités associées.
          </p>
        </div>
        <AdminNav />
      </header>

      {/* Onglets */}
      <section className="mt-8 flex gap-2">
        <button
          onClick={() => setActiveTab("poles")}
          className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide transition ${
            activeTab === "poles"
              ? "bg-white text-black"
              : "bg-white/[0.06] text-white/60 hover:text-white"
          }`}
        >
          Pôles
        </button>
        <button
          onClick={() => setActiveTab("features")}
          className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide transition ${
            activeTab === "features"
              ? "bg-white text-black"
              : "bg-white/[0.06] text-white/60 hover:text-white"
          }`}
        >
          Fonctionnalités
        </button>
      </section>

      {/* Actions */}
      <section className="mt-6 flex justify-end">
        <button
          onClick={() => {
            setIsCreating(true);
            setEditingItem(
              activeTab === "poles"
                ? { id: "", name: "", description: "", color: "#4C8BFF", icon: "⚽", active: true, order: poles.length + 1 }
                : { id: "", name: "", description: "", category: "Base", poles: [], active: true }
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
              {isCreating ? "Créer" : "Modifier"} {activeTab === "poles" ? "un pôle" : "une fonctionnalité"}
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

          {activeTab === "poles" ? (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Nom</label>
                <input
                  type="text"
                  value={(editingItem as Pole).name}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, name: e.target.value } as Pole)
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Description</label>
                <textarea
                  value={(editingItem as Pole).description}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, description: e.target.value } as Pole)
                  }
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">Couleur</label>
                  <input
                    type="color"
                    value={(editingItem as Pole).color}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, color: e.target.value } as Pole)
                    }
                    className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-2 focus:border-white/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">Icône (emoji)</label>
                  <input
                    type="text"
                    value={(editingItem as Pole).icon}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, icon: e.target.value } as Pole)
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Nom</label>
                <input
                  type="text"
                  value={(editingItem as Feature).name}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, name: e.target.value } as Feature)
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Description</label>
                <textarea
                  value={(editingItem as Feature).description}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, description: e.target.value } as Feature)
                  }
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Catégorie</label>
                <input
                  type="text"
                  value={(editingItem as Feature).category}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, category: e.target.value } as Feature)
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Pôles associés</label>
                <div className="grid grid-cols-2 gap-2">
                  {poles.map((pole) => (
                    <label key={pole.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(editingItem as Feature).poles.includes(pole.id)}
                        onChange={() => toggleFeaturePole((editingItem as Feature).id, pole.id)}
                        className="rounded border-white/30 bg-white/10 text-[#0054F0] focus:ring-[#0054F0]"
                      />
                      <span className="text-sm text-white/80">{pole.name}</span>
                    </label>
                  ))}
                </div>
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
              className="flex items-center size-2 rounded-full bg-[#0054F0] px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#2a6fff]"
            >
              <Save size={16} />
              Enregistrer
            </button>
          </div>
        </section>
      )}

      {/* Liste des éléments */}
      <section className="mt-8 space-y-4">
        {activeTab === "poles" ? (
          poles.map((pole) => (
            <article
              key={pole.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                    style={{ backgroundColor: `${pole.color}20` }}
                  >
                    {pole.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{pole.name}</h3>
                      {!pole.active && (
                        <span className="inline-flex rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                          Inactif
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/70">{pole.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: pole.color }}
                      />
                      <span className="text-xs text-white/50">{pole.color}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActive(pole.id, "poles")}
                    className={`rounded-full p-2 transition ${
                      pole.active
                        ? "text-green-400 hover:bg-green-500/20"
                        : "text-white/40 hover:bg-white/10"
                    }`}
                    title={pole.active ? "Désactiver" : "Activer"}
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingItem(pole);
                      setIsCreating(false);
                    }}
                    className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                    title="Modifier"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(pole.id, "poles")}
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
          features.map((feature) => (
            <article
              key={feature.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{feature.name}</h3>
                    {!feature.active && (
                      <span className="inline-flex rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                        Inactif
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/70 mb-3">{feature.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/70">
                      {feature.category}
                    </span>
                    {feature.poles.map((poleId) => {
                      const pole = poles.find((p) => p.id === poleId);
                      return pole ? (
                        <span
                          key={poleId}
                          className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: `${pole.color}40` }}
                        >
                          {pole.icon} {pole.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActive(feature.id, "features")}
                    className={`rounded-full p-2 transition ${
                      feature.active
                        ? "text-green-400 hover:bg-green-500/20"
                        : "text-white/40 hover:bg-white/10"
                    }`}
                    title={feature.active ? "Désactiver" : "Activer"}
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingItem(feature);
                      setIsCreating(false);
                    }}
                    className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                    title="Modifier"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(feature.id, "features")}
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
    </main>
  );
}
