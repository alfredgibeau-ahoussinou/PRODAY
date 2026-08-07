import { PageHeader } from "@/components/layout/PageHeader";
import { RoleAccentStage } from "@/components/immersive/RoleAccentStage";
import { TerminalCta } from "./TerminalCta";
import { TerminalFeatureGrid, type TerminalFeature } from "./TerminalFeatureGrid";
import { TerminalModuleTabs, type TerminalModuleTab } from "./TerminalModuleTabs";
import { TerminalPage } from "./TerminalPage";
import { TerminalStory } from "./TerminalStory";
import { TerminalValue, type TerminalValuePillar } from "./TerminalValue";
import { poleAccentCssVars } from "@/lib/brandColors";
import type { PageAccent } from "@/lib/siteArchitecture";
import {
  getRoleVisuals,
  type RoleVisualId,
} from "@/lib/roleVisuals";

export type TerminalProductPageProps = {
  pathname?: string;
  visualId?: RoleVisualId;
  kicker: string;
  title: string;
  description: string;
  image?: string;
  logo?: string;
  logoAlt?: string;
  accent?: PageAccent;
  story: { title: string; body: string; image?: string };
  breakdownTitle: string;
  breakdownKicker?: string;
  features: TerminalFeature[];
  platformTitle: string;
  platformDescription?: string;
  platformKicker?: string;
  modules: TerminalModuleTab[];
  value: {
    kicker?: string;
    title: string;
    description?: string;
    pillars: TerminalValuePillar[];
  };
  cta: {
    title: string;
    description?: string;
    primaryHref: string;
    primaryLabel: string;
    secondaryHref?: string;
    secondaryLabel?: string;
  };
};

/** Product page shell: cinematic media + optional lazy 3D accent. */
export function TerminalProductPage({
  pathname,
  visualId,
  kicker,
  title,
  description,
  image,
  logo,
  logoAlt,
  accent,
  story,
  breakdownTitle,
  breakdownKicker,
  features,
  platformTitle,
  platformDescription,
  platformKicker,
  modules,
  value,
  cta,
}: TerminalProductPageProps) {
  const pack = visualId ? getRoleVisuals(visualId) : null;
  const heroImage = image ?? pack?.hero;
  const heroVideo = pack?.heroVideo;
  const storyImage = story.image ?? pack?.story;
  const platformImage = pack?.platform;
  const accentKey = accent ?? visualId ?? "joueur";
  const accentStyle = poleAccentCssVars(accentKey);

  return (
    <TerminalPage accentStyle={accentStyle}>
      <PageHeader
        pathname={pathname}
        kicker={kicker}
        title={title}
        description={description}
        image={heroImage}
        video={heroVideo}
        logo={logo}
        logoAlt={logoAlt}
        accent={accent}
      />
      {pack?.showAccent3d && visualId ? (
        <RoleAccentStage
          role={visualId}
          kicker={pack.accentKicker}
          title={pack.accentTitle}
        />
      ) : null}
      <TerminalStory
        title={story.title}
        body={story.body}
        image={storyImage}
      />
      <TerminalFeatureGrid
        id="systeme"
        kicker={breakdownKicker}
        title={breakdownTitle}
        features={features}
      />
      <TerminalModuleTabs
        id="platform"
        kicker={platformKicker}
        title={platformTitle}
        description={platformDescription}
        tabs={modules}
        image={platformImage}
      />
      <TerminalValue
        id="valeur"
        kicker={value.kicker}
        title={value.title}
        description={value.description}
        pillars={value.pillars}
      />
      <TerminalCta
        title={cta.title}
        description={cta.description}
        primaryHref={cta.primaryHref}
        primaryLabel={cta.primaryLabel}
        secondaryHref={cta.secondaryHref}
        secondaryLabel={cta.secondaryLabel}
      />
    </TerminalPage>
  );
}
