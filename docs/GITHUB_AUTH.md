# Pousser ProDay sur GitHub

Si vous voyez :

```text
Invalid username or token. Password authentication is not supported
```

GitHub n’accepte plus le mot de passe Git — utilisez un **Personal Access Token** ou **SSH**.

## Option 1 — GitHub CLI (recommandé)

```bash
brew install gh
gh auth login
```

Choisir : GitHub.com → HTTPS → Login via browser.

Puis :

```bash
cd /Users/gibeau--ahoussinou/PRODAY
git push -u origin HEAD
```

## Option 2 — Token HTTPS

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Générer un token avec scope `repo`
3. Au prochain `git push`, username = votre login GitHub, password = le **token** (pas le mot de passe compte)

## Option 3 — SSH

```bash
ssh-keygen -t ed25519 -C "votre@email.com"
cat ~/.ssh/id_ed25519.pub
```

Ajouter la clé sur GitHub → **SSH keys**, puis :

```bash
git remote set-url origin git@github.com:alfredgibeau-ahoussinou/PRODAY.git
git push -u origin HEAD
```
