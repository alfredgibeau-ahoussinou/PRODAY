# Charte RGPD & Protection des Données des Mineurs

**Dernière mise à jour :** Septembre 2026  
**Éditeur :** ProDay  
**Contact DPO / Sécurité :** proday.admin@gmail.com  
**Version en ligne :** https://proday75.fr/confidentialite  

---

## 1. Engagement et Cadre Légal

ProDay attache une importance primordiale à la protection de la vie privée, à l'intégrité et à la sécurité des enfants et des adolescents utilisant la plateforme (application mobile et site internet).

Le présent document formalise la politique de traitement et de stockage des données à caractère personnel des mineurs, en stricte conformité avec :
- Le **Règlement Général sur la Protection des Données (RGPD - Règlement UE 2016/679)** ;
- La **Loi n° 78-17 du 6 janvier 1978 modifiée (Loi Informatique et Libertés)**, fixant la majorité numérique à 15 ans en France ;
- Les recommandations et lignes directrices de la **CNIL (Commission Nationale de l'Informatique et des Libertés)** relatives aux droits des mineurs dans l'environnement numérique.

---

## 2. Catégories de Données Collectées

Dans le cadre strict des activités sportives (entraînements, matchs, convocations, suivi de progression, logistique), ProDay collecte uniquement les données nécessaires et proportionnées :

1. **Données d'identité du mineur :**
   - Nom, prénom, date de naissance (détermination de la catégorie sportive U7 à U18).
   - Club d'appartenance, équipe sportive rattachée.
   - Photo de profil facultative (soumise à l'accord parental).
2. **Données sportives et organisationnelles :**
   - Poste sur le terrain, temps de jeu, statistiques collectives et individuelles de match.
   - Réponses aux convocations (présence/absence aux entraînements et matchs).
   - Historique sportif (catégories, tournois disputés).
3. **Données du représentant légal :**
   - Nom, prénom, adresse e-mail, numéro de téléphone portable du parent ou tuteur légal.
   - Lien de parenté ou de tutelle rattaché au compte du mineur.
4. **Données de déplacement & Covoiturage :**
   - Points de rendez-vous et trajets pour les événements de l'équipe.
   - Géolocalisation en temps réel : **strictement éphémère**, activée uniquement pendant la durée d'un trajet en cours et réservée aux participants du véhicule et à leurs parents.
5. **Données multimédias & Vidéos :**
   - Captations vidéo de matchs ou de séances d'entraînement réalisées par le club ou l'éducateur à des fins d'analyse tactique et pédagogique.

### Données expressément proscrites
ProDay s'interdit formellement :
- Toute collecte de données bancaires directement auprès des mineurs.
- Toute utilisation de données pour du ciblage publicitaire comportemental ou commercial envers les mineurs.
- Toute cession ou revente de données personnelles à des partenaires tiers ou régies publicitaires.

---

## 3. Consentement Parental et Sécurisation des Profils

### 3.1 Âge et Autorisation Parentale
Conformément à l'article 45 de la Loi Informatique et Libertés :
- Pour les mineurs de **moins de 15 ans**, le consentement au traitement des données personnelles est obligatoirement accordé conjointement par le mineur et le titulaire de l'autorité parentale (parent ou tuteur légal).
- Un compte parent / tuteur supervise directement le profil du jeune joueur.

### 3.2 Contrôle Parental et Cloisonnement (`parental_settings`)
ProDay intègre nativement des mécanismes techniques de sécurité renforcés :
- **Filtrage strict des interactions :** Les profils mineurs sont protégés contre les prises de contact non sollicitées par des tiers inconnus. Seuls les éducateurs certifiés du club et les coéquipiers de l'équipe peuvent interagir dans le cadre d'événements officiels.
- **Validation parentale des événements :** Les notifications de convocation et les demandes de covoiturage sont transmises au parent responsable.
- **Accès restreint au CV et à la visibilité sportive :** La diffusion d'informations sportives à des fins de détection ou recrutement requiert l'autorisation expresse du représentant légal.

---

## 4. Stockage, Hébergement et Mesures de Sécurité

### 4.1 Hébergement Souverain et Chiffrement
- **Localisation des serveurs :** Les données sont hébergées sur l'infrastructure Google Cloud / Firebase au sein de centres de données situés sur le territoire de l'**Union Européenne**.
- **Chiffrement :**
  - En transit : Protocoles sécurisés **HTTPS / TLS 1.3**.
  - Au repos : Chiffrement robuste **AES-256**.

### 4.2 Cloisonnement et Règles d'Accès
- L'accès aux bases de données est régi par des règles de sécurité Firestore strictes, empêchant toute lecture ou écriture non autorisée.
- Les données d'une équipe ou d'un mineur sont strictement étanches et accessibles uniquement par le staff autorisé du club et les parents légalement rattachés.

### 4.3 Données de Géolocalisation Éphémères
- Les coordonnées GPS émises lors d'un covoiturage sont partagées en flux direct avec les passagers et parents autorisés.
- **Dès la clôture du trajet par le conducteur, les coordonnées de géolocalisation sont immédiatement et définitivement effacées des serveurs.** Aucun historique des déplacements GPS continus n'est conservé.

### 4.4 Analyse Vidéo Sécurisée
- Les vidéos d'entraînement et de match sont stockées dans des espaces privés propres au club ou à l'équipe.
- Elles ne sont pas publiques et ne peuvent être partagées en dehors du cadre sportif défini sans accord parental.

---

## 5. Durée de Conservation et Purge des Données

ProDay applique le principe de minimisation et de limitation de la conservation :

| Type de donnée | Durée de conservation | Modalité d'archivage / purge |
| :--- | :--- | :--- |
| **Compte & Profil sportif** | Durée de la licence sportive / utilisation active | Suppression sous 90 jours après clôture du compte |
| **Convocations & Présences** | Saison sportive en cours (1 an) | Purge automatique à la fin de la saison sportive |
| **Géolocalisation Covoiturage** | Durée du trajet uniquement (quelques heures) | **Purge immédiate dès l'arrivée à destination** |
| **Vidéos & Analyses de match** | Durée décidée par le club (max. 2 saisons) | Suppression sur demande ou à l'expiration de la licence |
| **Comptes inactifs** | 2 saisons consécutives sans connexion | Notification préalable puis suppression définitive |

---

## 6. Droits des Familles et Modalités d'Exercice

Conformément aux articles 15 à 22 du RGPD, les mineurs et leurs représentants légaux disposent à tout moment des droits suivants :

1. **Droit d'accès :** Obtenir la confirmation que des données sont traitées et en recevoir une copie complète.
2. **Droit de rectification :** Corriger ou mettre à jour des informations inexactes.
3. **Droit à l'effacement (« Droit à l'oubli ») :** Droit renforcé pour les mineurs permettant la suppression immédiate et définitive de leurs données.
4. **Droit à la limitation et à l'opposition :** Restreindre ou refuser certains traitements de données non indispensables.
5. **Droit à la portabilité :** Recevoir les données sportives dans un format structuré, lisible par machine (export PDF/JSON du CV joueur).

### Contact DPO & Réclamation
Pour exercer ces droits ou poser toute question relative à la protection des données :
* **E-mail dédié :** `proday.admin@gmail.com` (réponse garantie sous un délai maximal de 30 jours).
* **Autorité de contrôle :** En cas de contestation, vous disposez du droit d'introduire une réclamation auprès de la **CNIL** (Commission Nationale de l'Informatique et des Libertés) :
  * En ligne : [www.cnil.fr](https://www.cnil.fr)
  * Par courrier : CNIL — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.

---

## 7. Formulaire d'Autorisation et de Consentement Parental

*(Document à conserver par le club ou à valider dans l'application ProDay)*

### Identification du Mineur
- **Nom de l'enfant :** ............................................................................
- **Prénom :** .......................................................................................
- **Date de naissance :** ...... / ...... / ............   **Catégorie :** ....................
- **Club sportif :** ...............................................................................

### Identification du Représentant Légal
- **Nom du parent / tuteur :** ................................................................
- **Prénom :** .......................................................................................
- **Téléphone portable :** .......................................................................
- **Adresse e-mail :** ............................................................................

### Consentements Express
- [ ] **Création du profil sportif ProDay :** J'autorise la création du compte sportif de mon enfant rattaché au club pour la gestion des entraînements, convocations et matchs.
- [ ] **Organisation des déplacements & Covoiturage :** J'autorise l'inscription de mon enfant aux modules de covoiturage organisés par les parents/éducateurs et le partage temporaire de géolocalisation durant le trajet.
- [ ] **Analyse vidéo & Droit à l'image pédagogique :** J'autorise la prise de vues vidéo lors des séances et matchs à des fins exclusives d'analyse technique et de débriefing par le staff éducatif de l'équipe.

Fait à : ...................................................., le ...... / ...... / 20......

**Signature du Représentant Légal :**
