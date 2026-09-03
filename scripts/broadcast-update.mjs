import admin from "firebase-admin";
import emailjs from "@emailjs/nodejs";
import { resolve } from "path";
import { readFileSync } from "fs";

// Load env
const root = process.cwd();
try {
  const envRaw = readFileSync(resolve(root, ".env"), "utf8");
  for (const line of envRaw.split("\n")) {
    const l = line.trim();
    if (l && !l.startsWith("#")) {
      const eq = l.indexOf("=");
      if (eq > 0) {
        process.env[l.slice(0, eq)] = l.slice(eq + 1).replace(/^"|"$/g, "");
      }
    }
  }
} catch (e) {}

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountBase64) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY");
  process.exit(1);
}

const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, "base64").toString("utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
  });
}

const db = admin.firestore();
const auth = admin.auth();

const SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;

async function run() {
  console.log("Fetching users...");
  const usersRef = await db.collection("users").get();
  
  const emails = [];
  usersRef.forEach(doc => {
    const data = doc.data();
    if (data.email) emails.push(data.email);
  });
  
  // Dedup emails
  const uniqueEmails = [...new Set(emails)];
  console.log(`Found ${uniqueEmails.length} users to email.`);
  
  if (process.argv.includes("--dry-run")) {
    console.log("Dry run mode. Not sending emails.");
    console.log("Sample template:");
    console.log(`
Subject: ProDay : La Bêta est Officiellement Ouverte ! 🚀
Message: 
Bonjour ! 

L'application ProDay a reçu une mise à jour majeure et la bêta est désormais ouverte à tous, sans liste d'attente !
Vous pouvez dès à présent télécharger l'APK Android ou rejoindre TestFlight iOS directement depuis notre site :
https://proday75.fr/beta/inscription

Nouveau : Un formulaire de support intégré a été ajouté sur le site si vous rencontrez des problèmes d'installation.

L'équipe ProDay.
    `);
    process.exit(0);
  }
  
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY || !PRIVATE_KEY) {
    console.error("Missing EmailJS config");
    process.exit(1);
  }

  console.log("Starting broadcast...");
  let sent = 0;
  let errors = 0;
  
  for (const email of uniqueEmails) {
    try {
      const templateParams = {
        to_email: email,
        subject: "ProDay : La Bêta est Officiellement Ouverte ! 🚀",
        message: "L'application ProDay a reçu une mise à jour majeure et la bêta est désormais ouverte à tous, sans liste d'attente !\n\nVous pouvez dès à présent télécharger l'APK Android ou rejoindre TestFlight iOS directement depuis notre site :\nhttps://proday75.fr/beta/inscription\n\nNouveau : Un formulaire de support intégré a été ajouté sur le site si vous rencontrez des problèmes d'installation.\n\nL'équipe ProDay."
      };
      
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, {
        publicKey: PUBLIC_KEY,
        privateKey: PRIVATE_KEY
      });
      sent++;
      console.log(`[${sent}/${uniqueEmails.length}] Sent to ${email}`);
    } catch (e) {
      console.error(`Failed to send to ${email}:`, e.message || e.text);
      errors++;
    }
    
    // Rate limiting (EmailJS usually allows a few req/sec, let's wait 500ms)
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\nBroadcast complete. Sent: ${sent}, Errors: ${errors}`);
}

run().catch(console.error);
