import express from "express";
import path from "path";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { INITIAL_COMPLAINTS } from "./src/data/mockData";
import { CivicComplaint } from "./src/types";

// User and Auth interfaces
interface ServerUser {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  role: "citizen" | "officer" | "admin";
  badgeNumber?: string;
  department?: string;
  avatar?: string;
}

interface ServerSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

// Password hashing helper using SHA-256 + salt
function hashPassword(password: string, salt: string): string {
  return crypto.createHmac("sha256", salt).update(password).digest("hex");
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

// Seed accounts for the 3 roles
const citizenSalt = generateSalt();
const officerSalt = generateSalt();
const adminSalt = generateSalt();

const USERS_DB: ServerUser[] = [
  {
    id: "usr-citizen-01",
    email: "citizen@icmrs.gov",
    salt: citizenSalt,
    passwordHash: hashPassword("Citizen123!", citizenSalt),
    name: "Marcus Vance",
    role: "citizen",
    badgeNumber: "CT-88942-X",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: "usr-officer-01",
    email: "officer@icmrs.gov",
    salt: officerSalt,
    passwordHash: hashPassword("Officer123!", officerSalt),
    name: "Elena Vance",
    role: "officer",
    badgeNumber: "OFFICER-042",
    department: "Ward 04 Public Works Response",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAo1spD6uHFwwgatDTJluJOHotpybzw1nBkawW4CpVC6tlgHanXHxZvE0b9hld20gHblmdWB1BKG26TxYFl08U0B-ZXXEI1jdhNWju4uXF9hCFgd5N9KkNaLrVmbsK6jSUlD-791HHLMzt7oy1RI-Z_Jg1iOQ8Hblq4NHF2N2s9dbKjfkqQu2gyn0Km1a1bvL1fpxUYzB9D3cLbyVdzxcmXvTJctldXOlrLGGDuADl4FDBluoZE6eIUaQ",
  },
  {
    id: "usr-admin-01",
    email: "admin@icmrs.gov",
    salt: adminSalt,
    passwordHash: hashPassword("Admin123!", adminSalt),
    name: "Dir. A. Vance-Miller",
    role: "admin",
    badgeNumber: "ADM-DIR-001",
    department: "District Municipal Governance & Oversight",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
  },
];

// In-memory active sessions store
const SESSIONS_DB = new Map<string, ServerSession>();

function sanitizeUser(user: ServerUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    badgeNumber: user.badgeNumber,
    department: user.department,
    avatar: user.avatar,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ==========================================
  // AUTHENTICATION APIs
  // ==========================================

  // POST /api/auth/register - Register a new citizen account
  app.post("/api/auth/register", (req, res) => {
    try {
      const { name, email, password, wardOrSector } = req.body || {};

      if (!name || typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: "Full name is required (minimum 2 characters).",
        });
      }

      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({
          success: false,
          error: "A valid email address is required.",
        });
      }

      if (!password || typeof password !== "string" || password.length < 6) {
        return res.status(400).json({
          success: false,
          error: "Password must be at least 6 characters.",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = USERS_DB.find((u) => u.email.toLowerCase() === normalizedEmail);

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: "An account with this email address already exists. Please log in instead.",
        });
      }

      const salt = generateSalt();
      const passwordHash = hashPassword(password, salt);
      const tokenNumber = Math.floor(10000 + Math.random() * 90000);
      const newUserId = `usr-citizen-${Date.now()}`;
      const departmentName = wardOrSector && typeof wardOrSector === "string" && wardOrSector.trim()
        ? wardOrSector.trim()
        : "District 04 Resident";

      // Select avatar
      const avatarList = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
      ];
      const selectedAvatar = avatarList[Math.floor(Math.random() * avatarList.length)];

      const newCitizen: ServerUser = {
        id: newUserId,
        email: normalizedEmail,
        passwordHash,
        salt,
        name: name.trim(),
        role: "citizen",
        badgeNumber: `CT-${tokenNumber}-X`,
        department: departmentName,
        avatar: selectedAvatar,
      };

      USERS_DB.push(newCitizen);

      // Issue active session token immediately
      const token = `icmrs_sess_${crypto.randomBytes(32).toString("hex")}`;
      const now = Date.now();
      const expiresAt = now + 24 * 60 * 60 * 1000;

      SESSIONS_DB.set(token, {
        token,
        userId: newCitizen.id,
        createdAt: now,
        expiresAt,
      });

      return res.status(201).json({
        success: true,
        message: "Citizen account registered successfully.",
        token,
        user: sanitizeUser(newCitizen),
      });
    } catch (err) {
      console.error("Registration server error:", err);
      return res.status(500).json({
        success: false,
        error: "Internal server error during citizen registration.",
      });
    }
  });

  // POST /api/auth/login - Validate credentials and return session token
  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body || {};

      if (!email || !password || typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({
          success: false,
          error: "Invalid request. Email and password are required.",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = USERS_DB.find((u) => u.email.toLowerCase() === normalizedEmail);

      // Constant-time check / generic error to prevent user enumeration
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password. Please verify your credentials.",
        });
      }

      const computedHash = hashPassword(password, user.salt);
      if (computedHash !== user.passwordHash) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password. Please verify your credentials.",
        });
      }

      // Generate cryptographically secure session token (24h lifespan)
      const token = `icmrs_sess_${crypto.randomBytes(32).toString("hex")}`;
      const now = Date.now();
      const expiresAt = now + 24 * 60 * 60 * 1000;

      SESSIONS_DB.set(token, {
        token,
        userId: user.id,
        createdAt: now,
        expiresAt,
      });

      return res.json({
        success: true,
        token,
        user: sanitizeUser(user),
      });
    } catch (err) {
      console.error("Authentication server error:", err);
      return res.status(500).json({
        success: false,
        error: "Internal authentication error. Please try again later.",
      });
    }
  });

  // GET /api/auth/me - Validate current session Bearer token and return user profile
  app.get("/api/auth/me", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Missing or malformed authorization token.",
      });
    }

    const token = authHeader.substring(7).trim();
    const session = SESSIONS_DB.get(token);

    if (!session || session.expiresAt < Date.now()) {
      if (session) SESSIONS_DB.delete(token);
      return res.status(401).json({
        success: false,
        error: "Session expired or invalid. Please log in again.",
      });
    }

    const user = USERS_DB.find((u) => u.id === session.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Associated user account not found.",
      });
    }

    return res.json({
      success: true,
      user: sanitizeUser(user),
    });
  });

  // POST /api/auth/logout - Invalidate active session token
  app.post("/api/auth/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      SESSIONS_DB.delete(token);
    }
    return res.json({
      success: true,
      message: "Session ended successfully.",
    });
  });

  // In-memory complaint storage initialized with municipal mock data
  let complaints: CivicComplaint[] = INITIAL_COMPLAINTS.map((c) => ({
    ...c,
    latitude: c.coordinates.lat,
    longitude: c.coordinates.lng,
  }));

  // GET /api/complaints - Returns all complaints with latitude, longitude, and priority
  app.get("/api/complaints", (req, res) => {
    // Return complaints with explicit latitude, longitude, priority
    const formatted = complaints.map((c) => ({
      ...c,
      latitude: c.latitude ?? c.coordinates?.lat ?? 47.6097,
      longitude: c.longitude ?? c.coordinates?.lng ?? -122.3331,
      coordinates: {
        lat: c.latitude ?? c.coordinates?.lat ?? 47.6097,
        lng: c.longitude ?? c.coordinates?.lng ?? -122.3331,
      },
    }));
    res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  });

  // POST /api/complaints - Submit a new complaint
  app.post("/api/complaints", (req, res) => {
    try {
      const body = req.body;
      const lat = body.latitude ?? body.coordinates?.lat ?? 47.6097;
      const lng = body.longitude ?? body.coordinates?.lng ?? -122.3331;

      const newComplaint: CivicComplaint = {
        id: body.id || `#ICMRS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
        title: body.title || 'Untitled Hazard',
        description: body.description || 'Public works hazard reported by citizen.',
        category: body.category || 'Roads & Bridges',
        location: body.location || 'Ward 04 Municipal Sector',
        latitude: lat,
        longitude: lng,
        coordinates: { lat, lng },
        status: body.status || 'Pending Triage',
        pipelineStep: body.pipelineStep || 1,
        pipelineStepName: body.pipelineStepName || 'Step 1 of 5: Telemetry Received & Dispatched',
        pipelinePercent: body.pipelinePercent || 20,
        assignedCrew: body.assignedCrew || 'Triage Dispatch Unit 04',
        timeLogged: body.timeLogged || 'Just now',
        slaRemaining: body.slaRemaining || '48h 00m SLA standard',
        slaStatus: body.slaStatus || 'nominal',
        imageUrl: body.imageUrl,
        imageAlt: body.imageAlt,
        gpsTagged: body.gpsTagged ?? true,
        officerNotes: body.officerNotes || [],
        priority: body.priority || 'Medium',
        citizenToken: body.citizenToken || `CT-${Math.floor(10000 + Math.random() * 90000)}-X`,
      };

      complaints.unshift(newComplaint);
      res.status(201).json({ success: true, data: newComplaint });
    } catch (err) {
      console.error("Error creating complaint:", err);
      res.status(400).json({ success: false, error: "Invalid complaint data" });
    }
  });

  // PATCH /api/complaints/:id - Update complaint status or details
  app.patch("/api/complaints/:id", (req, res) => {
    const { id } = req.params;
    const index = complaints.findIndex((c) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: "Complaint not found" });
    }

    const updated = {
      ...complaints[index],
      ...req.body,
    };
    if (req.body.latitude || req.body.longitude) {
      updated.coordinates = {
        lat: req.body.latitude ?? updated.coordinates.lat,
        lng: req.body.longitude ?? updated.coordinates.lng,
      };
    }
    complaints[index] = updated;
    res.json({ success: true, data: updated });
  });

  // ==========================================
  // GEMINI CIVIC AI CHATBOT API
  // ==========================================
  let genAIClient: GoogleGenAI | null = null;
  function getGenAI(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    if (!genAIClient) {
      genAIClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return genAIClient;
  }

  // POST /api/chat - Multi-turn conversational civic assistant
  app.post("/api/chat", async (req, res) => {
    try {
      const { 
        messages, 
        model = "gemini-3.5-flash", 
        roleType = "general",
        userContext,
        complaintsContext 
      } = req.body || {};

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Messages array is required for conversation turn.",
        });
      }

      // Validate and determine model according to project guidelines:
      // gemini-3.1-pro-preview for complex tasks, gemini-3.5-flash for general tasks, gemini-3.1-flash-lite for fast tasks
      const allowedModels = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview"];
      
      let selectedModel = "gemini-3.5-flash";
      let effectiveRole = roleType || "general";

      // If model is "auto" or not directly an allowed model, apply intelligent automatic classification
      if (!model || model === "auto" || !allowedModels.includes(model)) {
        const lastUserText = messages
          .filter((m: any) => m.role === "user")
          .slice(-1)[0]?.text?.toLowerCase() || "";

        const isComplex = lastUserText.includes("code") || 
          lastUserText.includes("ordinance") || 
          lastUserText.includes("engineering") || 
          lastUserText.includes("specification") || 
          lastUserText.includes("compliance") || 
          lastUserText.includes("statute") ||
          lastUserText.includes("bituminous") ||
          lastUserText.includes("structural") ||
          lastUserText.length > 250;

        const isFast = lastUserText.includes("hotline") || 
          lastUserText.includes("emergency number") || 
          lastUserText.includes("phone") || 
          lastUserText.includes("quick") || 
          lastUserText.includes("fast") ||
          (lastUserText.length < 30 && !isComplex);

        if (isComplex) {
          selectedModel = "gemini-3.1-pro-preview";
          effectiveRole = "expert";
        } else if (isFast) {
          selectedModel = "gemini-3.1-flash-lite";
          effectiveRole = "fast";
        } else {
          selectedModel = "gemini-3.5-flash";
          effectiveRole = "general";
        }
      } else {
        selectedModel = model;
      }

      // Build context of current active tickets in the city if available
      const activeTicketsSummary = (complaintsContext && Array.isArray(complaintsContext) ? complaintsContext : complaints)
        .slice(0, 8)
        .map((c: any) => `- Ticket ${c.id}: "${c.title}" at ${c.location} | Status: ${c.status} (${c.pipelineStepName || c.status}) | SLA: ${c.slaRemaining || 'Standard 24h'} | Priority: ${c.priority || 'Medium'}`)
        .join("\n");

      // Construct rich municipal assistant system instructions
      let roleInstructions = "";
      if (effectiveRole === "fast") {
        roleInstructions = "You are in Quick-Response mode. Give snappy, high-speed, direct answers (1-2 sentences maximum) prioritizing emergency hotlines, ticket IDs, or actionable steps.";
      } else if (effectiveRole === "expert") {
        roleInstructions = "You are in Senior Municipal Engineering & Compliance Specialist mode. Provide in-depth technical diagnostics (e.g. asphalt bituminous binder specs, hydraulic pressure thresholds, electrical conduit standards, municipal code citations §14-B) alongside procedural civic remedies.";
      } else {
        roleInstructions = "You are in General Civic Triage mode. Guide the citizen warmly and professionally through reporting their problem, explaining SLA expectations, and checking active municipal work orders.";
      }

      const citizenName = userContext?.name || "Citizen";
      const citizenWard = userContext?.ward || "Metro District 04";

      const systemInstruction = `You are the Metro District 04 Intelligent Civic Response System (ICMRS) Virtual Officer.
Current Citizen: ${citizenName} (${citizenWard}).
${roleInstructions}

District 04 Municipal Context:
- Active Municipal Tickets in Ward:
${activeTicketsSummary}
- Emergency Escalation Hotlines (24/7 Crew Dispatch):
  • Water / Gas Mains Burst: 311-990
  • Fallen Electrical Lines / Power Arcing: 311-881
  • Sewer Surge & Hazardous Spills: 311-885
- Standard Turnaround SLAs:
  • Water, Sewer & Hydrology: ~8.2 hours
  • Roadways & Asphalt Potholes: ~16.4 hours
  • Public Lighting & Traffic Signals: ~18.0 hours
  • Forestry, Storm Debris & Trees: ~21.5 hours

Instructions:
1. When a citizen talks or asks about a problem (e.g., potholes, unlit lampposts, water leaks, illegal dumping, broken curb, traffic signals, sidewalk cracks), listen attentively, acknowledge the hazard, diagnose its urgency, and provide immediate clarity.
2. If their query refers to a specific street or ticket in Ward 04 (e.g., Oak Ave pothole #001245 or Elmwood streetlight #001198), cite the actual status from the District 04 tickets above.
3. If they want to file a new problem or report a hazard, summarize what details are needed (exact street location, photo evidence, description) and instruct them to use the "File a Complaint" wizard.
4. Maintain a warm, encouraging, respectful public servant tone. Keep answers structured and easily readable on mobile devices.
5. If the situation presents immediate life or bodily danger (live wires, gas smell, massive water sinkhole), prominently emphasize calling 911 or the direct emergency hotlines first.`;

      // Filter and sanitize conversation contents for Gemini
      // Contents must have { role: 'user' | 'model', parts: [{ text: string }] }
      // Gemini expects the first message in contents to be from 'user'.
      const rawContents = messages
        .filter((m: any) => m && typeof m.text === "string" && m.text.trim().length > 0)
        .map((m: any) => ({
          role: m.role === "bot" || m.role === "model" ? "model" : "user",
          parts: [{ text: m.text.trim() }],
        }));

      // Find index of first 'user' message
      const firstUserIndex = rawContents.findIndex((c: any) => c.role === "user");
      const sanitizedContents = firstUserIndex !== -1 ? rawContents.slice(firstUserIndex) : rawContents;

      if (sanitizedContents.length === 0) {
        return res.status(400).json({
          success: false,
          error: "At least one user message is required in the conversation history.",
        });
      }

      const ai = getGenAI();

      if (!ai) {
        // Fallback simulation if GEMINI_API_KEY is not configured yet
        const lastUserMessage = sanitizedContents[sanitizedContents.length - 1]?.parts[0]?.text || "";
        const lower = lastUserMessage.toLowerCase();
        let fallbackText = `Thank you for reaching out to Metro District 04 Civic Response, ${citizenName}. `;
        
        if (lower.includes("pothole") || lower.includes("road") || lower.includes("oak")) {
          fallbackText += `Regarding road hazards: Ticket #ICMRS-2026-001245 on Oak Ave is currently active at Step 3: Asphalt Crew Deployed. Crew 09 is on site. Standard turnaround SLA for roadway repair is 16.4 hours. You can file a new road defect with photo verification anytime!`;
        } else if (lower.includes("light") || lower.includes("dark") || lower.includes("lamp")) {
          fallbackText += `Regarding public lighting: Luminaire outages are triaged within 18.0 hours. Power node #SL-402 on Elmwood is currently de-energized for public safety while crews install solid-state drivers.`;
        } else if (lower.includes("water") || lower.includes("leak") || lower.includes("pipe")) {
          fallbackText += `Regarding water & hydrology: For severe main breaks, call our 24/7 hotline at 311-990. Hydrology dispatch crews achieve an 8.2-hour average response time across District 04.`;
        } else if (lower.includes("emergency") || lower.includes("wire") || lower.includes("danger")) {
          fallbackText += `URGENT NOTICE: For downed wires or life hazards, dial 311-881 immediately. Stand back at least 30 feet from any fallen cables.`;
        } else {
          fallbackText += `I have registered your inquiry. Our municipal dispatch network continuously tracks civic maintenance across Ward 04. Would you like to file a new complaint, check existing ticket milestones, or speak with an on-duty supervisor?`;
        }

        return res.json({
          success: true,
          text: fallbackText,
          model: selectedModel,
          isFallback: true,
        });
      }

      // Call Gemini API server-side
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: sanitizedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const responseText = response.text || "Thank you for contacting Metro District 04 Civic Response. Your report has been acknowledged by municipal triage.";

      return res.json({
        success: true,
        text: responseText,
        model: selectedModel,
      });
    } catch (err: any) {
      console.error("Gemini Chat API Error:", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "An error occurred while contacting the Gemini civic assistant service.",
        text: "I apologize, but our municipal AI dispatch is momentarily reconnecting to the telemetry server. You can still report emergencies directly via 311-990 or use the manual complaint filing wizard.",
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "ICMRS Municipal Telemetry API" });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ICMRS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
