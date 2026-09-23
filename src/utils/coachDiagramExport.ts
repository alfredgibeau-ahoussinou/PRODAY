import { Platform, Share } from 'react-native';
import type {
  ExerciseDiagramData,
  DiagramElement,
  DiagramLegendItem,
  ExerciseStage,
} from '../models/ExerciseDiagram';
import { COACH_SITE } from '../content/coachPageIdentity';
import { proSemantic } from '../theme/professionalDesign';
import { extractAnimationKeyframes } from './diagramAnimationEngine';

export interface DiagramExportOptions {
  exerciseName?: string;
  durationMin?: number;
  intensity?: string;
  instructions?: string;
  objective?: string;
  clubName?: string;
  coachName?: string;
}

/**
 * Génère une chaîne SVG autonome et responsive à partir des données de schéma.
 */
export function buildStandaloneSvgString(
  diagram: ExerciseDiagramData,
  activeElements?: DiagramElement[],
): string {
  const elements = activeElements || diagram.elements || [];
  const vbW = diagram.width || 100;
  const vbH = diagram.height || 64;

  const renderPitchLines = () => {
    switch (diagram.pitchTemplate) {
      case 'full':
        return `
          <!-- Terrain complet -->
          <rect x="2" y="2" width="${vbW - 4}" height="${vbH - 4}" rx="2" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.7"/>
          <line x1="${vbW / 2}" y1="2" x2="${vbW / 2}" y2="${vbH - 2}" stroke="rgba(255,255,255,0.3)" stroke-width="0.6"/>
          <circle cx="${vbW / 2}" cy="${vbH / 2}" r="8" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.6"/>
          <!-- Surfaces -->
          <rect x="2" y="${vbH / 2 - 14}" width="16" height="28" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.6"/>
          <rect x="${vbW - 18}" y="${vbH / 2 - 14}" width="16" height="28" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.6"/>
        `;
      case 'box':
        return `
          <!-- Zone d'exercice -->
          <rect x="2" y="2" width="${vbW - 4}" height="${vbH - 4}" rx="2" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="0.6" stroke-dasharray="2,2"/>
        `;
      case 'blank':
        return `<!-- Espace libre d'entraînement -->`;
      case 'half':
      default:
        return `
          <!-- Demi-terrain -->
          <rect x="2" y="2" width="${vbW - 4}" height="${vbH - 4}" rx="2" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.7"/>
          <rect x="22" y="2" width="56" height="24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.6"/>
          <circle cx="50" cy="16" r="0.8" fill="#FFF"/>
          <path d="M 38 26 A 9 9 0 0 0 62 26" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.6"/>
        `;
    }
  };

  const renderElements = () => {
    return elements
      .map((el) => {
        if (el.type === 'zone') {
          return `
            <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="2"
              fill="${el.color || 'rgba(16,185,129,0.1)'}"
              fill-opacity="${el.fillOpacity ?? 0.12}"
              stroke="${el.color || proSemantic.success}"
              stroke-width="0.8"
              ${el.style === 'dashed' ? 'stroke-dasharray="2,2"' : ''}
            />
            ${
              el.label
                ? `<text x="${el.x + 2}" y="${el.y + 4}" font-size="2.4" font-weight="700" fill="${el.color || '#FFF'}" opacity="0.9">${escapeHtml(el.label)}</text>`
                : ''
            }
          `;
        }

        if (el.type === 'arrow') {
          const color = el.color || (el.kind === 'pass' ? '#38BDF8' : el.kind === 'shot' ? proSemantic.danger : proSemantic.success);
          const isDashed = el.kind === 'pass';
          const isDribble = el.kind === 'dribble';
          const dash = isDashed ? 'stroke-dasharray="2,1.5"' : isDribble ? 'stroke-dasharray="1,1"' : '';
          const markerId = `m-${color.replace('#', '')}`;

          if (el.controlX != null && el.controlY != null) {
            return `
              <defs>
                <marker id="${markerId}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="${color}" />
                </marker>
              </defs>
              <path d="M ${el.fromX} ${el.fromY} Q ${el.controlX} ${el.controlY} ${el.toX} ${el.toY}"
                fill="none" stroke="${color}" stroke-width="0.9" ${dash} marker-end="url(#${markerId})" />
            `;
          }

          return `
            <defs>
              <marker id="${markerId}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="${color}" />
              </marker>
            </defs>
            <line x1="${el.fromX}" y1="${el.fromY}" x2="${el.toX}" y2="${el.toY}"
              stroke="${color}" stroke-width="0.9" ${dash} marker-end="url(#${markerId})" />
          `;
        }

        if (el.type === 'equipment') {
          const rot = el.rotation ? `transform="rotate(${el.rotation} ${el.x} ${el.y})"` : '';
          switch (el.equipmentType) {
            case 'cone':
              return `<polygon points="${el.x},${el.y - 2.5} ${el.x - 2},${el.y + 2.5} ${el.x + 2},${el.y + 2.5}" fill="${el.color || proSemantic.warning}" stroke="#FFF" stroke-width="0.3" ${rot}/>`;
            case 'disc_cone':
              return `<circle cx="${el.x}" cy="${el.y}" r="1.6" fill="${el.color || proSemantic.warning}" stroke="#000" stroke-width="0.3" ${rot}/>`;
            case 'ball':
              return `<circle cx="${el.x}" cy="${el.y}" r="1.4" fill="#FFFFFF" stroke="#000000" stroke-width="0.5"/>`;
            case 'goal':
              return `
                <g ${rot}>
                  <rect x="${el.x}" y="${el.y}" width="${el.width || 20}" height="${el.height || 4}" fill="none" stroke="#FFFFFF" stroke-width="1.2"/>
                  <line x1="${el.x}" y1="${el.y}" x2="${el.x}" y2="${el.y + (el.height || 4)}" stroke="#FFF" stroke-width="1"/>
                  <line x1="${el.x + (el.width || 20)}" y1="${el.y}" x2="${el.x + (el.width || 20)}" y2="${el.y + (el.height || 4)}" stroke="#FFF" stroke-width="1"/>
                </g>
              `;
            case 'mini_goal':
              return `
                <g ${rot}>
                  <rect x="${el.x}" y="${el.y}" width="${el.width || 6}" height="${el.height || 10}" fill="none" stroke="#FFFFFF" stroke-width="1"/>
                  <line x1="${el.x}" y1="${el.y + 3}" x2="${el.x + (el.width || 6)}" y2="${el.y + 3}" stroke="#FFF" stroke-width="0.4" stroke-dasharray="1,1"/>
                  <line x1="${el.x}" y1="${el.y + 7}" x2="${el.x + (el.width || 6)}" y2="${el.y + 7}" stroke="#FFF" stroke-width="0.4" stroke-dasharray="1,1"/>
                </g>
              `;
            case 'mannequin':
              return `
                <g ${rot}>
                  <circle cx="${el.x}" cy="${el.y - 1.8}" r="1.2" fill="#E2E8F0" stroke="#000" stroke-width="0.3"/>
                  <rect x="${el.x - 1.8}" y="${el.y}" width="3.6" height="4.5" rx="0.8" fill="#E2E8F0" stroke="#000" stroke-width="0.3"/>
                </g>
              `;
            case 'ladder':
              return `
                <g ${rot}>
                  <rect x="${el.x - 2}" y="${el.y - 8}" width="4" height="16" fill="none" stroke="#F59E0B" stroke-width="0.6"/>
                  ${[-6, -3, 0, 3, 6].map((offset) => `<line x1="${el.x - 2}" y1="${el.y + offset}" x2="${el.x + 2}" y2="${el.y + offset}" stroke="#F59E0B" stroke-width="0.6"/>`).join('')}
                </g>
              `;
            default:
              return '';
          }
        }

        if (el.type === 'player') {
          const fillColor = el.color || (el.team === 'away' ? proSemantic.danger : el.team === 'gk' ? '#F59E0B' : el.team === 'neutral' ? proSemantic.warning : proSemantic.info);
          return `
            <g>
              <circle cx="${el.x}" cy="${el.y}" r="2.9" fill="${fillColor}" stroke="#FFFFFF" stroke-width="0.7"/>
              ${
                el.num != null
                  ? `<text x="${el.x}" y="${el.y + 1.1}" font-size="2.7" font-weight="800" fill="#FFFFFF" text-anchor="middle">${el.num}</text>`
                  : ''
              }
              ${
                el.label
                  ? `<text x="${el.x}" y="${el.y + 5.2}" font-size="2.1" font-weight="700" fill="#FFFFFF" text-anchor="middle" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))">${escapeHtml(el.label)}</text>`
                  : ''
              }
            </g>
          `;
        }

        if (el.type === 'text') {
          return `<text x="${el.x}" y="${el.y}" font-size="${el.fontSize || 2.8}" font-weight="700" fill="${el.color || '#FFFFFF'}">${escapeHtml(el.text)}</text>`;
        }

        return '';
      })
      .join('\n');
  };

  return `
    <svg viewBox="0 0 ${vbW} ${vbH}" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="border-radius: 8px; overflow: hidden; background: ${COACH_SITE.pitchDeep};">
      <!-- Pelouse avec bandes d'herbe -->
      <rect x="0" y="0" width="${vbW}" height="${vbH}" fill="${COACH_SITE.pitchDeep}"/>
      ${[0, 1, 2, 3, 4, 5]
        .map(
          (i) =>
            `<rect x="${i * (vbW / 6)}" y="0" width="${vbW / 12}" height="${vbH}" fill="${COACH_SITE.pitchLight}" opacity="0.35"/>`,
        )
        .join('')}
      ${renderPitchLines()}
      ${renderElements()}
    </svg>
  `;
}

/**
 * Génère le document HTML complet et autonome prêt pour l'impression A4 ou l'export PDF.
 */
export function generateDiagramHtml(
  diagram: ExerciseDiagramData,
  options?: DiagramExportOptions,
): string {
  const title = options?.exerciseName || diagram.name || 'Atelier d’entraînement';
  const objective = options?.objective || diagram.objective || 'Objectif pédagogique et principes de jeu';
  const instructions = options?.instructions || diagram.instructions || 'Consignes détaillées de mise en place, dimensions et rotations.';
  const duration = options?.durationMin ? `${options.durationMin} min` : '15-20 min';
  const intensity = options?.intensity || 'Modérée';
  const svg = buildStandaloneSvgString(diagram);

  const stages = diagram.stages || [];
  const keyframes = extractAnimationKeyframes(diagram);
  const isAnimated = Boolean(diagram.animation && diagram.animation.stages?.length);

  const animationHtml = isAnimated
    ? `
      <div class="section-title">Séquence tactique animée • Déplacements clés (${keyframes.length} phases)</div>
      <div class="stages-grid">
        ${keyframes
          .map(
            (kf, idx) => `
          <div class="stage-card">
            <div class="stage-badge">Phase ${idx + 1}</div>
            <div class="stage-name">${escapeHtml(kf.stageTitle)}</div>
            ${kf.instruction ? `<div class="stage-instructions">${escapeHtml(kf.instruction)}</div>` : ''}
            <div class="stage-preview" style="margin-top: 8px; border-radius: 4px; overflow: hidden; border: 1px solid #E2E8F0;">
              ${buildStandaloneSvgString(diagram, kf.elements)}
            </div>
          </div>
        `,
          )
          .join('')}
      </div>
    `
    : '';

  const stagesHtml =
    stages.length > 0
      ? `
        <div class="section-title">Étapes de l'atelier (${stages.length})</div>
        <div class="stages-grid">
          ${stages
            .map(
              (st, idx) => `
            <div class="stage-card">
              <div class="stage-badge">Étape ${idx + 1}</div>
              <div class="stage-name">${escapeHtml(st.name)}</div>
              ${st.instructions ? `<div class="stage-instructions">${escapeHtml(st.instructions)}</div>` : ''}
              ${st.elements?.length ? `<div class="stage-preview">${buildStandaloneSvgString(diagram, st.elements)}</div>` : ''}
            </div>
          `,
            )
            .join('')}
        </div>
      `
      : '';

  const legend = diagram.legend || [];
  const legendHtml =
    legend.length > 0
      ? `
        <div class="legend-row">
          ${legend
            .map(
              (l) => `
            <div class="legend-item">
              <span class="legend-dot" style="background-color: ${l.color};"></span>
              <span>${escapeHtml(l.label)}</span>
            </div>
          `,
            )
            .join('')}
        </div>
      `
      : '';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Schéma d’atelier • ${escapeHtml(title)} | ProDay Coach</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      padding: 24px;
      line-height: 1.45;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #00F59B;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      color: #0F172A;
      text-transform: uppercase;
      letter-spacing: -0.02em;
    }
    .badge {
      background: #0F172A;
      color: #00F59B;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 8px;
      border-radius: 4px;
      display: inline-block;
      letter-spacing: 0.05em;
    }
    .meta {
      font-size: 12px;
      color: #64748B;
      margin-top: 4px;
      font-weight: 500;
    }
    .chips {
      display: flex;
      gap: 10px;
      margin-top: 6px;
    }
    .chip {
      background: #F1F5F9;
      border: 1px solid #CBD5E1;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      color: #334155;
    }
    .diagram-wrap {
      max-width: 600px;
      margin: 16px auto;
      box-shadow: 0 4px 14px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #E2E8F0;
    }
    .legend-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 16px;
      margin-top: 8px;
      margin-bottom: 20px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #475569;
    }
    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #0F172A;
      margin-top: 18px;
      margin-bottom: 6px;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 4px;
    }
    .objective-box {
      background: #F8FAFC;
      border-left: 3px solid #00F59B;
      padding: 10px 14px;
      font-size: 12px;
      color: #1E293B;
      font-weight: 600;
      margin-bottom: 12px;
      border-radius: 0 6px 6px 0;
    }
    .instructions-box {
      font-size: 12px;
      color: #334155;
      white-space: pre-wrap;
      line-height: 1.5;
    }
    .stages-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 12px;
      margin-top: 10px;
    }
    .stage-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px;
    }
    .stage-badge {
      font-size: 10px;
      font-weight: 800;
      color: #0284C7;
      text-transform: uppercase;
    }
    .stage-name {
      font-size: 12px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 2px;
    }
    .stage-instructions {
      font-size: 11px;
      color: #64748B;
      margin-top: 4px;
    }
    .footer {
      margin-top: 30px;
      border-top: 1px dashed #CBD5E1;
      padding-top: 10px;
      font-size: 10px;
      color: #94A3B8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 0; }
      .diagram-wrap { box-shadow: none; }
    }
  </style>
</head>
<body>
  <header class="header">
    <div>
      <div class="badge">PRODAY COACH • FICHE ATELIER</div>
      <h1 class="title">${escapeHtml(title)}</h1>
      <div class="meta">Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} • ProDay Football</div>
      <div class="chips">
        <span class="chip">⏱ ${escapeHtml(duration)}</span>
        <span class="chip">⚡ Intensité : ${escapeHtml(intensity)}</span>
        ${options?.clubName ? `<span class="chip">🛡 ${escapeHtml(options.clubName)}</span>` : ''}
      </div>
    </div>
    <div style="text-align: right; font-size: 11px; color: #64748B;">
      ${options?.coachName ? `Entraîneur : <strong>${escapeHtml(options.coachName)}</strong>` : ''}
    </div>
  </header>

  <div class="objective-box">
    🎯 <strong>Objectif :</strong> ${escapeHtml(objective)}
  </div>

  <div class="diagram-wrap">
    ${svg}
  </div>

  ${legendHtml}

  <div class="section-title">Consignes & Mise en place</div>
  <div class="instructions-box">${escapeHtml(instructions)}</div>

  ${animationHtml || stagesHtml}

  <footer class="footer">
    <span>Document d'atelier tactique généré via ProDay • proday75.fr</span>
    <span>Usage interne entraînement & vestiaires</span>
  </footer>
</body>
</html>
  `;
}

/**
 * Déclenche l'export ou l'impression :
 * - Sur Web : ouvre une fenêtre d'impression native du navigateur
 * - Sur mobile natif : partage la fiche d'atelier via le système de partage
 */
export async function exportOrPrintDiagram(
  diagram: ExerciseDiagramData,
  options?: DiagramExportOptions,
): Promise<void> {
  const html = generateDiagramHtml(diagram, options);

  if (Platform.OS === 'web') {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    }
    return;
  }

  const title = options?.exerciseName || diagram.name;
  const summary = [
    `FICHE ATELIER PRODAY : ${title}`,
    `Objectif : ${options?.objective || diagram.objective || 'Atelier tactique'}`,
    `Durée : ${options?.durationMin ? `${options.durationMin} min` : '15-20 min'}`,
    `\nConsignes :\n${options?.instructions || diagram.instructions || 'Consulter le schéma tactique dans ProDay.'}`,
  ].join('\n');

  await Share.share({
    title: `Atelier • ${title}`,
    message: summary,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
