"use client";

import { useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { Send, Mail, Clock, CheckCircle, XCircle, RefreshCw, Eye, Trash2, Plus, Save, X } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: "welcome" | "notification" | "marketing" | "system";
  active: boolean;
  lastUsed: string;
  usageCount: number;
}

interface EmailLog {
  id: string;
  recipient: string;
  template: string;
  subject: string;
  status: "sent" | "failed" | "pending";
  sentAt: string;
}

const mockTemplates: EmailTemplate[] = [
  {
    id: "welcome",
    name: "Email de bienvenue",
    subject: "Bienvenue sur ProDay !",
    category: "welcome",
    active: true,
    lastUsed: "2024-07-26T10:30:00Z",
    usageCount: 234,
  },
  {
    id: "beta-approved",
    name: "Approbation bêta",
    subject: "Votre inscription bêta est approuvée",
    category: "notification",
    active: true,
    lastUsed: "2024-07-25T14:20:00Z",
    usageCount: 156,
  },
  {
    id: "newsletter",
    name: "Newsletter mensuelle",
    subject: "Les nouveautés ProDay du mois",
    category: "marketing",
    active: false,
    lastUsed: "2024-06-30T09:00:00Z",
    usageCount: 89,
  },
];

const mockLogs: EmailLog[] = [
  {
    id: "1",
    recipient: "user1@example.com",
    template: "welcome",
    subject: "Bienvenue sur ProDay !",
    status: "sent",
    sentAt: "2024-07-26T10:30:00Z",
  },
  {
    id: "2",
    recipient: "user2@example.com",
    template: "beta-approved",
    subject: "Votre inscription bêta est approuvée",
    status: "sent",
    sentAt: "2024-07-26T09:15:00Z",
  },
  {
    id: "3",
    recipient: "invalid@example",
    template: "welcome",
    subject: "Bienvenue sur ProDay !",
    status: "failed",
    sentAt: "2024-07-26T08:45:00Z",
  },
];

const CATEGORY_LABELS: Record<EmailTemplate["category"], string> = {
  welcome: "Bienvenue",
  notification: "Notification",
  marketing: "Marketing",
  system: "Système",
};

const STATUS_LABELS: Record<EmailLog["status"], string> = {
  sent: "Envoyé",
  failed: "Échoué",
  pending: "En attente",
};

const STATUS_COLORS: Record<EmailLog["status"], string> = {
  sent: "text-green-400 bg-green-500/20",
  failed: "text-red-400 bg-red-500/20",
  pending: "text-amber-400 bg-amber-500/20",
};

export function AdminEmails() {
  const [activeTab, setActiveTab] = useState<"templates" | "logs">("templates");
  const [templates, setTemplates] = useState<EmailTemplate[]>(mockTemplates);
  const [logs, setLogs] = useState<EmailLog[]>(mockLogs);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleToggleActive = (id: string) => {
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === id ? { ...template, active: !template.active } : template
      )
    );
  };

  const handleResend = (logId: string) => {
    if (!confirm("Renvoyer cet email ?")) return;
 setLogs((prev) =>
      prev.map((log) =>
        log.id === logId ? { ...log, status: "pending" } : log
      )
    );
  };

  const handleDelete = (id: string, type: "template" | "log") => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) return;
    
    if (type === "template") {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } else {
      setLogs((prev) => prev.filter((l) => l.id !== id));
    }
  };

  const handleSave = (template: EmailTemplate) => {
    if (isCreating) {
      setTemplates((prev) => [...prev, template]);
    } else {
      setTemplates((prev) =>
        prev.map((t) => (t.id === template.id ? template : t))
      );
    }
    setEditingTemplate(null);
    setIsCreating(false);
  };

  return (
    <main className="relative mx-auto w-full max-w-7xl px-6 py-12">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-[0.22em] text-[#4C8BFF]">
            Admin · Emails
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
            Gestion des emails
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/55">
            Gérez les templates d'emails et consultez l'historique des envois.
          </p>
        </div>
        <AdminNav />
      </header>

      {/* Onglets */}
      <section className="mt-8 flex gap-2">
        <button
          onClick={() => setActiveTab("templates")}
          className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide transition ${
            activeTab === "templates"
              ? "bg-white text-black"
              : "bg-white/[0.06] text-white/60 hover:text-white"
          }`}
        >
          Templates
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide transition ${
            activeTab === "logs"
              ? "bg-white text-black"
              : "bg-white/[0.06] text-white/60 hover:text-white"
          }`}
        >
          Historique
        </button>
      </section>

      {/* Actions */}
      {activeTab === "templates" && (
        <section className="mt-6 flex justify-end">
          <button
            onClick={() => {
              setIsCreating(true);
              setEditingTemplate({
                id: "",
                name: "",
                subject: "",
                category: "notification",
                active: true,
                lastUsed: new Date().toISOString(),
                usageCount: 0,
              });
            }}
            className="flex items-center gap-2 rounded-full bg-[#0054F0] px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#2a6fff]"
          >
            <Plus size={16} />
            Nouveau template
          </button>
        </section>
      )}

      {/* Formulaire d'édition/création */}
      {editingTemplate && (
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-white">
              {isCreating ? "Créer" : "Modifier"} un template
            </h3>
            <button
              onClick={() => {
                setEditingTemplate(null);
                setIsCreating(false);
              }}
              className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Nom</label>
              <input
                type="text"
                value={editingTemplate.name}
                onChange={(e) =>
                  setEditingTemplate({ ...editingTemplate, name: e.target.value })
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Sujet</label>
              <input
                type="text"
                value={editingTemplate.subject}
                onChange={(e) =>
                  setEditingTemplate({ ...editingTemplate, subject: e.target.value })
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Catégorie</label>
              <select
                value={editingTemplate.category}
                onChange={(e) =>
                  setEditingTemplate({ ...editingTemplate, category: e.target.value as EmailTemplate["category"] })
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
              >
                <option value="welcome">Bienvenue</option>
                <option value="notification">Notification</option>
                <option value="marketing">Marketing</option>
                <option value="system">Système</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={() => {
                setEditingTemplate(null);
                setIsCreating(false);
              }}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white/70 transition hover:bg-white/10"
            >
              Annuler
            </button>
            <button
              onClick={() => handleSave(editingTemplate)}
              className="flex items-center gap-2 rounded-full bg-[#0054F0] px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#2a6fff]"
            >
              <Save size={16} />
              Enregistrer
            </button>
          </div>
        </section>
      )}

      {/* Liste des templates */}
      {activeTab === "templates" && (
        <section className="mt-8 space-y-4">
          {templates.map((template) => (
            <article
              key={template.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white">{template.name}</h3>
                    {!template.active && (
                      <span className="inline-flex rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                        Inactif
                      </span>
                    )}
                    <span className="inline-flex rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/70">
                      {CATEGORY_LABELS[template.category]}
                    </span>
                  </div>
                  <p className="text-sm text-white/70 mb-2">{template.subject}</p>
                  <div className="flex items-center gap-4 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      <Mail size={14} />
                      {template.usageCount} envois
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      Dernier: {formatDate(template.lastUsed)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActive(template.id)}
                    className={`rounded-full p-2 transition ${
                      template.active
                        ? "text-green-400 hover:bg-green-500/20"
                        : "text-white/40 hover:bg-white/10"
                    }`}
                    title={template.active ? "Désactiver" : "Activer"}
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingTemplate(template);
                      setIsCreating(false);
                    }}
                    className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                    title="Modifier"
                  >
                    <Mail size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id, "template")}
                    className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-red-400"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Historique des emails */}
      {activeTab === "logs" && (
        <section className="mt-8">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                    Destinataire
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                    Template
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                    Sujet
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                    Envoyé le
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-white/60">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 last:border-0">
                    <td className="px-6 py-4">
                      <span className="text-white/80">{log.recipient}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/60">{log.template}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/80">{log.subject}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[log.status]}`}
                      >
                        {STATUS_LABELS[log.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-white/60">{formatDate(log.sentAt)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {log.status === "failed" && (
                          <button
                            onClick={() => handleResend(log.id)}
                            className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-green-400"
                            title="Renvoyer"
                          >
                            <RefreshCw size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(log.id, "log")}
                          className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-red-400"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
