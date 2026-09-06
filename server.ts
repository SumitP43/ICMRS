import express from "express";
import path from "path";
import crypto from "crypto";
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
