"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

const searchItems = [
  { title: "Accueil", href: ROUTES.home, category: "Navigation" },
  { title: "Quiz profil", href: ROUTES.quiz, category: "Outils" },
  { title: "Comparatif des pôles", href: ROUTES.compare, category: "Outils" },
  { title: "FAQ", href: ROUTES.faq, category: "Aide" },
  { title: "Pôle Joueur", href: ROUTES.joueur, category: "Pôles" },
  { title: "Pôle Club", href: ROUTES.proClub, category: "Pôles" },
  { title: "Pôle Staff", href: ROUTES.proStaff, category: "Pôles" },
  { title: "Pôle Événements", href: ROUTES.evenements, category: "Pôles" },
  { title: "Supporter", href: ROUTES.supporter, category: "Pôles" },
  { title: "Santé", href: ROUTES.sante, category: "Pôles" },
  { title: "Partenaires", href: ROUTES.sponsor, category: "Pôles" },
  { title: "Tarifs", href: ROUTES.pricing, category: "Information" },
  { title: "Fonctionnalités", href: ROUTES.features, category: "Information" },
  { title: "Vision", href: ROUTES.vision, category: "Information" },
  { title: "À propos", href: ROUTES.about, category: "Information" },
  { title: "Inscription bêta", href: ROUTES.betaWaitlist, category: "Action" },
];

export function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState(searchItems);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setFilteredItems(searchItems);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim() === "") {
      setFilteredItems(searchItems);
    } else {
      const filtered = searchItems.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [query]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-20 z-50 mx-auto max-w-2xl rounded-2xl border border-white/10 bg-[#0c0c10] p-6 shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Search className="h-5 w-5 text-white/50" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher sur ProDay..."
                className="flex-1 bg-transparent text-lg text-white placeholder:text-white/30 focus:outline-none"
                autoFocus
              />
              <button
                onClick={onClose}
                className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white transition"
                aria-label="Fermer la recherche"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 max-h-96 overflow-y-auto">
              {filteredItems.length === 0 ? (
                <p className="py-8 text-center text-white/50">Aucun résultat trouvé</p>
              ) : (
                <div className="space-y-1">
                  {filteredItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center justify-between rounded-lg px-4 py-3 text-white hover:bg-white/10 transition group"
                    >
                      <div>
                        <span className="font-medium">{item.title}</span>
                        <span className="ml-2 text-xs text-white/40">· {item.category}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 text-xs text-white/40">
              <p>Utilisez les flèches pour naviguer, Entrée pour sélectionner, Échap pour fermer</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
