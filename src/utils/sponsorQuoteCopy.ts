import type { SponsorQuoteRequest } from '../models/SponsorQuoteRequest';

export function buildDefaultQuoteSubject(companyName: string): string {
  const name = companyName.trim() || 'votre entreprise';
  return `Votre devis ProDay Sponsor — ${name}`;
}

export function buildDefaultQuoteHtmlPreview(request: SponsorQuoteRequest): string {
  const packageLabels: Record<string, string> = {
    starter: 'Découverte (0 €)',
    territorial: 'Territorial (49 €/mois)',
    national: 'National Pro (99 €/mois)',
    custom: 'Sur-mesure',
  };
  const greeting = request.contact_name.trim() || 'Bonjour';
  const goals = request.goals?.length ? `<li>Objectifs : ${request.goals.join(', ')}</li>` : '';
  const regions = request.regions?.length ? `<li>Zones : ${request.regions.join(', ')}</li>` : '';
  const budget = request.budget ? `<li>Budget : ${request.budget}</li>` : '';

  const label = packageLabels[request.package_tier] ?? 'Sur-mesure';
  return `<p>${greeting},</p>
<p>Merci pour votre intérêt pour <strong>ProDay Sponsor</strong>. Voici notre proposition pour <strong>${request.company_name}</strong>.</p>
<p><strong>${label}</strong></p>
<ul>${budget}${goals}${regions}</ul>
<p>Répondez à cet email pour valider ou ajuster la proposition.</p>
<p>Cordialement,<br/>L'équipe ProDay Partenaires</p>`;
}
