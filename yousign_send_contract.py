#!/usr/bin/env python3
"""
=========================================================
  PRODAY — Envoi du contrat bêta-testeur via Yousign API
  Plateforme : Yousign v3 (certifiée eIDAS, RGPD)
  Doc API    : https://developers.yousign.com/
=========================================================

PRÉREQUIS :
  1. Créer un compte gratuit sur https://yousign.com
  2. Aller dans : Paramètres > API > Créer une clé API
  3. Coller la clé dans la variable API_KEY ci-dessous
  4. Renseigner l'e-mail et le nom du signataire côté club
  5. Lancer : python3 yousign_send_contract.py
"""

import requests
import json
import os
import sys
from datetime import datetime, timedelta

# ============================================================
#   ⚙️  CONFIGURATION — À RENSEIGNER AVANT DE LANCER
# ============================================================

API_KEY = "VOTRE_CLE_API_YOUSIGN"       # Ex: "live_xxxxxxxxxxxxxxxxxxxx"
ENVIRONMENT = "production"               # "production" ou "sandbox" (pour tester)

# Fichier PDF du contrat
PDF_PATH = os.path.join(os.path.dirname(__file__), "Contrat_BetaTesteur_USOrmesson_PRODAY.pdf")

# Informations du signataire côté PRODAY (pré-rempli d'après le Kbis)
SIGNER_PRODAY = {
    "first_name": "Yohan Christophe",
    "last_name": "Semedo",
    "email": "contact@proday.fr",        # ← Remplacer par votre vraie adresse
    "phone_number": "+33600000000",      # ← Remplacer par votre vrai numéro (pour OTP)
    "locale": "fr",
}

# Informations du signataire côté US Ormesson Football
SIGNER_CLUB = {
    "first_name": "",                    # ← Prénom du représentant du club
    "last_name": "",                     # ← Nom du représentant du club
    "email": "secretariat.uso.foot@gmail.com",  # E-mail officiel du club
    "phone_number": "",                  # ← Numéro du représentant (pour OTP)
    "locale": "fr",
}

# Paramètres de la demande
SIGNATURE_REQUEST_NAME = "Contrat Bêta-Testeur PRODAY × US Ormesson Football — USO-BETA-2026-001"
EXPIRATION_DAYS = 30                     # Nombre de jours avant expiration du lien

# ============================================================
#   🔧  CONFIGURATION API (ne pas modifier)
# ============================================================

BASE_URLS = {
    "production": "https://api.yousign.app/v3",
    "sandbox":    "https://api-sandbox.yousign.app/v3",
}

BASE_URL = BASE_URLS[ENVIRONMENT]

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}


# ============================================================
#   🚀  FONCTIONS D'INTÉGRATION
# ============================================================

def check_config():
    """Vérifie que la configuration est complète."""
    errors = []
    if API_KEY == "VOTRE_CLE_API_YOUSIGN":
        errors.append("❌ API_KEY non renseignée — ouvrir ce fichier et coller votre clé Yousign")
    if not SIGNER_CLUB["first_name"]:
        errors.append("❌ Prénom du signataire club manquant (SIGNER_CLUB['first_name'])")
    if not SIGNER_CLUB["last_name"]:
        errors.append("❌ Nom du signataire club manquant (SIGNER_CLUB['last_name'])")
    if not SIGNER_CLUB["phone_number"]:
        errors.append("❌ Numéro de téléphone du signataire club manquant (pour OTP Yousign)")
    if not os.path.exists(PDF_PATH):
        errors.append(f"❌ Fichier PDF introuvable : {PDF_PATH}")
    if errors:
        print("\n🔴 CONFIGURATION INCOMPLÈTE :\n")
        for e in errors:
            print(f"  {e}")
        print("\n📝 Ouvrez ce fichier et renseignez les informations manquantes.\n")
        sys.exit(1)
    print("✅ Configuration valide")


def upload_document():
    """Étape 1 : Upload du PDF sur Yousign."""
    print("\n📤 Upload du contrat PDF sur Yousign...")
    with open(PDF_PATH, "rb") as f:
        pdf_content = f.read()

    response = requests.post(
        f"{BASE_URL}/documents",
        headers={"Authorization": f"Bearer {API_KEY}"},
        files={"file": ("Contrat_BetaTesteur_USOrmesson_PRODAY.pdf", pdf_content, "application/pdf")},
        data={"nature": "signable_document"},
    )
    response.raise_for_status()
    doc = response.json()
    doc_id = doc["id"]
    print(f"  ✅ Document uploadé — ID : {doc_id}")
    return doc_id


def create_signature_request(doc_id):
    """Étape 2 : Création de la demande de signature."""
    print("\n📋 Création de la demande de signature...")
    expiration = (datetime.utcnow() + timedelta(days=EXPIRATION_DAYS)).strftime("%Y-%m-%dT%H:%M:%SZ")

    payload = {
        "name": SIGNATURE_REQUEST_NAME,
        "delivery_mode": "email",
        "ordered_signers": False,
        "reminder_settings": {
            "interval_in_days": 3,
            "max_occurrences": 5,
        },
        "timezone": "Europe/Paris",
        "expiration_date": expiration,
        "email_custom_note": (
            "Bonjour,\n\n"
            "Veuillez trouver ci-joint le contrat de participation au Programme Bêta-Testeur PRODAY "
            "pour l'US Ormesson Football (USO-BETA-2026-001).\n\n"
            "Ce contrat vous donne accès gratuitement et sans engagement à la plateforme PRODAY "
            "pendant 12 mois.\n\n"
            "Merci de le signer électroniquement en cliquant sur le bouton ci-dessous.\n\n"
            "L'équipe PRODAY\n"
            "contact@proday.fr"
        ),
        "documents": [{"document_id": doc_id}],
    }

    response = requests.post(
        f"{BASE_URL}/signature_requests",
        headers=HEADERS,
        json=payload,
    )
    response.raise_for_status()
    req = response.json()
    req_id = req["id"]
    print(f"  ✅ Demande créée — ID : {req_id}")
    return req_id


def add_signer(req_id, doc_id, signer_info, label):
    """Étape 3 : Ajout d'un signataire."""
    print(f"\n👤 Ajout du signataire {label} : {signer_info['first_name']} {signer_info['last_name']}...")

    payload = {
        "info": {
            "first_name": signer_info["first_name"],
            "last_name": signer_info["last_name"],
            "email": signer_info["email"],
            "phone_number": signer_info["phone_number"],
            "locale": signer_info["locale"],
        },
        "signature_authentication_mode": "otp_sms",
        "fields": [
            {
                "document_id": doc_id,
                "type": "signature",
                "page": 4,              # Page de signature (dernière page du contrat)
                "x": 75 if label == "PRODAY" else 330,
                "y": 650,
                "width": 180,
                "height": 70,
            }
        ],
    }

    response = requests.post(
        f"{BASE_URL}/signature_requests/{req_id}/signers",
        headers=HEADERS,
        json=payload,
    )
    response.raise_for_status()
    signer = response.json()
    signer_id = signer["id"]
    print(f"  ✅ Signataire ajouté — ID : {signer_id}")
    return signer_id


def activate_signature_request(req_id):
    """Étape 4 : Activation et envoi des e-mails de signature."""
    print("\n🚀 Activation et envoi des e-mails de signature...")
    response = requests.post(
        f"{BASE_URL}/signature_requests/{req_id}/activate",
        headers=HEADERS,
    )
    response.raise_for_status()
    result = response.json()
    print(f"  ✅ Demande activée — Statut : {result.get('status', 'ongoing')}")
    return result


def get_signing_links(req_id):
    """Étape 5 : Récupération des liens de signature directs."""
    print("\n🔗 Récupération des liens de signature...")
    response = requests.get(
        f"{BASE_URL}/signature_requests/{req_id}",
        headers=HEADERS,
    )
    response.raise_for_status()
    data = response.json()

    signers = data.get("signers", [])
    links = []
    for s in signers:
        name = f"{s.get('info', {}).get('first_name', '')} {s.get('info', {}).get('last_name', '')}".strip()
        email = s.get("info", {}).get("email", "")
        link = s.get("signature_link", "")
        links.append({"name": name, "email": email, "link": link})
        print(f"  📧 {name} ({email})")
        if link:
            print(f"     🔗 {link}")

    return req_id, links


def save_result(req_id, links):
    """Sauvegarde le résumé dans un fichier."""
    result_path = os.path.join(os.path.dirname(__file__), "yousign_result.json")
    data = {
        "signature_request_id": req_id,
        "created_at": datetime.utcnow().isoformat(),
        "environment": ENVIRONMENT,
        "contract": SIGNATURE_REQUEST_NAME,
        "signers": links,
        "dashboard_url": f"https://app.yousign.com/signature-requests/{req_id}",
    }
    with open(result_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\n💾 Résumé sauvegardé : {result_path}")
    return data


# ============================================================
#   ▶️  POINT D'ENTRÉE
# ============================================================

if __name__ == "__main__":
    print("=" * 60)
    print("  PRODAY — Envoi contrat via Yousign")
    print("=" * 60)

    # 0. Vérification config
    check_config()

    try:
        # 1. Upload du PDF
        doc_id = upload_document()

        # 2. Création de la demande
        req_id = create_signature_request(doc_id)

        # 3. Ajout des signataires
        add_signer(req_id, doc_id, SIGNER_PRODAY, "PRODAY")
        add_signer(req_id, doc_id, SIGNER_CLUB, "US Ormesson Football")

        # 4. Activation
        activate_signature_request(req_id)

        # 5. Liens de signature
        req_id, links = get_signing_links(req_id)

        # 6. Sauvegarde
        result = save_result(req_id, links)

        print("\n" + "=" * 60)
        print("  ✅ CONTRAT ENVOYÉ AVEC SUCCÈS !")
        print("=" * 60)
        print(f"\n  📊 Tableau de bord Yousign :")
        print(f"     {result['dashboard_url']}")
        print(f"\n  ⏰ Le contrat expire dans {EXPIRATION_DAYS} jours.")
        print(f"  🔔 Des rappels automatiques seront envoyés tous les 3 jours.")
        print()

    except requests.HTTPError as e:
        print(f"\n🔴 Erreur API Yousign ({e.response.status_code}) :")
        try:
            print(json.dumps(e.response.json(), indent=2, ensure_ascii=False))
        except:
            print(e.response.text)
        sys.exit(1)
    except Exception as e:
        print(f"\n🔴 Erreur inattendue : {e}")
        sys.exit(1)
