import { NextResponse } from "next/server";
import { getEmailJsBetaConfig } from "@/lib/betaEmailjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, message, email } = body;
    
    if (!type || !message || !email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const config = getEmailJsBetaConfig();
    if (!config) {
      console.warn("EmailJS not configured, simulating success for beta");
      return NextResponse.json({ success: true, warning: "simulated" });
    }

    const templateParams = {
      to_email: "proday.admin@gmail.com", // Admin email
      from_email: email, // User's email
      subject: `[Support ProDay] ${type}`,
      message: `Type: ${type}\nEmail de contact: ${email}\n\nMessage:\n${message}`,
    };

    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: config.serviceId,
        template_id: config.templateId, 
        user_id: config.publicKey,
        accessToken: config.privateKey,
        template_params: templateParams,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("EmailJS Support Error:", txt);
      return NextResponse.json({ error: "EmailJS provider error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Support API Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur inconnue" }, { status: 500 });
  }
}
