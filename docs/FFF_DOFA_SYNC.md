# FFF DOFA Sync — Competition ID Mapping

## Principe

Le sync quotidien `scheduledFffStandingsSync` (04:15 Paris) récupère les classements
live depuis deux sources :

1. **API-Football** (`v3.football.api-sports.io`) : 4 championnats nationaux.
2. **DOFA FFF** (`api-dofa.prd-aws.fff.fr`) : championnats régionaux/districts IDF.

Pour que le sync DOFA fonctionne, il faut renseigner la variable
`DOFA_COMPET_IDS` avec les identifiants numériques des compétitions.

## Variables à configurer

### API-Football (nationaux)

Déjà gérés par `EXTERNAL_SCORES_API_KEY` / `EXTERNAL_SCORES_API_URL`.

```bash
firebase functions:config:set \
  external_scores.api_key="VOTRE_CLE_API_FOOTBALL" \
  external_scores.api_url="https://v3.football.api-sports.io"
```

### DOFA (régionaux / districts)

```bash
firebase functions:config:set \
  dofa.compet_ids='{"r1_idf_a":"<ID>","r1_idf_b":"<ID>","r2_idf":"<ID>","d1_d92":"<ID>","d2_d92":"<ID>","d1_d93":"<ID>","d1_d75":"<ID>","d1_d94":"<ID>","national2_c":"<ID>","u19_nat_a":"<ID>"}'
```

Le champ `DOFA_COMPET_IDS` est lu dans `functions/src/fffStandingsSync.ts` via
`process.env.DOFA_COMPET_IDS`. Sans cette variable, les ligues district/regional
écriront un shell vide (`source: 'awaiting_dofa_map'`).

## Comment trouver les IDs DOFA

Les identifiants sont des nombres entiers visibles dans l'URL du site officiel FFF
lorsqu'on consulte une compétition :

```
https://www.fff.fr/competition/engagement/425640-national/
                                               ^^^^^^^^
                                               ID DOFA
```

Méthode :

1. Allez sur le site d'un district/ligne (ex : `district-foot92.fff.fr/competitions/`)
2. Cliquez sur une compétition (ex : "Division 1, Poule Unique - 2026/2027")
3. L'URL affichée contient l'ID (ex : `?id=XXXXXX`)
4. Vérifiez avec curl (depuis un environement où `api-dofa.prd-aws.fff.fr` est résolu) :

```bash
curl -s -H "Accept: application/json" \
  "https://api-dofa.prd-aws.fff.fr/api/compets/XXXXXX/classement_journees.json"
```

> **Note d'accès** : Depuis ce workspace, `api-dofa.prd-aws.fff.fr` n'est pas
> résolu (DNS). Les IDs doivent être récupérés depuis l'interface web FFF ou un
> réseau où le domaine est accessible.

## Mapping actuel des ligues (à compléter avec les IDs réels)

| ProDay ID  | Compétition                         | District / Ligue            | Saison 2026/2027 |
|------------|-------------------------------------|-----------------------------|------------------|
| `d1_d92`   | D1 Poule Unique                     | District 92 (Hauts-de-Seine)| 12 équipes       |
| `d2_d92`   | D2 Poule A                          | District 92                 | à récupérer      |
| `r1_idf_a` | R1 Poule A                          | Ligue Paris-Île-de-France   | 12 équipes       |
| `r1_idf_b` | R1 Poule B                          | Ligue Paris-Île-de-France   | 12 équipes       |
| `r2_idf`   | R2 Poule B                          | Ligue Paris-Île-de-France   | 12 équipes       |
| `d1_d93`   | D1 Poule Unique                     | District 93 (Seine-Saint-Denis)| 13 équipes    |
| `d1_d75`   | D1 Poule Unique                     | District 75 (Paris)         | 12 équipes       |
| `d1_d94`   | D1 Poule Unique                     | District 94 (Val-de-Marne)  | à récupérer      |
| `national2_c` | National 2 Poule C               | FFF National                 | à récupérer      |
| `u19_nat_a` | National U19 Poule A               | FFF National                 | à récupérer      |
| `ligue1`   | Ligue 1 McDonald's                  | API-Football (id=61)        | via API-Football |
| `ligue2`   | Ligue 2 BKT                         | API-Football (id=62)        | via API-Football |
| `national1`| National 1 FFF                      | API-Football (id=4)         | via API-Football |
| `d1_fem`   | Arkema Première Ligue               | API-Football (id=64)        | via API-Football |

## Clubs observés en 2026/2027 (source : LiguesDeFoot.fr)

### District 92 — D1 Poule Unique
AS Ararat Issy, Colombes LSO, Courbevoie Sports, CSM Clamart Football,
Garenne Colombes AF, Gennevilliers CSM, Montrouge FC 92, Nanterre ES,
FC Plessis Robinson, Puteaux CSM, Vanves Stade, Villeneuve la Garenne AM

### Régional 1 IDF — Poule A
Esperance Aulnaysienne, Football Club 93, Le Mee Sports, FC Mantois 78,
Mitry Compans Goelly, Montreuil FC, Montrouge FC 92, OFC Mureaux,
Paris 13 Atletico, Saint-Brice FC, FC Saint-Leu 95, CO Les Ulis

### Régional 1 IDF — Poule B
CSL Aulnay, AS Chatou, Elan Chevilly-Larue Football, Claye-Souilly SF,
Courbevoie Sports, US Créteil 2, ES Saint-Gratien, FC Fleury 91,
Houilles AC, FC Melun, Saint-Denis US, US Villejuif

### Régional 2 IDF — Poule B
CA Vitry, Villemomble Sports, Puteaux CSM, FCM Aubervilliers, FC Morangis-Chilly,
US de Rungis, Sevran FC, Rueil-Malmaison FC, Paray FC, Tremblay FC,
Sainte-Geneviève FC, FC Plessis Robinson

### District 93 — D1 Poule Unique
Atletico De Bagnolet, Esperance Aulnaysienne, Blanc-Mesnil SF, Etoile Bobigny,
UF Clichois, Epinay Academie de Football, Football Club 93, Livry Gargan FC,
Montreuil FC, Noisy Le Grand FC, Olympique de Pantin-Bobigny, Tremblay FC,
Villemomble Sports

### District 75 (Paris) — D1 Poule Unique
Nicolaite Chaillot, Paris Sc, Parisienne Es, Couronnes O.f.c.,
Maccabi Paris Métropole, AC Paris 15, La Salesienne de Paris, AS Paris,
Seizieme Es, Paris Alesia FC, JSC Pitray Olier, Racing Club 18

## Déploiement

Après configuration des variables :

```bash
firebase deploy --only functions:scheduledFffStandingsSync,functions:syncFffStandingsNow
```

Le premier run écrira les shells vides pour les ligues sans ID DOFA. Dès que
`DOFA_COMPET_IDS` est renseigné, le sync écrit les vraies données live.
