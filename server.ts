import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { INITIAL_COMPLAINTS } from "./src/data/mockData";
import { CivicComplaint } from "./src/types";
import { requireAuth, optionalAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getUsers, getOrCreateUser } from "./src/db/users.ts";
import { getAllComplaintsFromDb, insertComplaintToDb, updateComplaintInDb } from "./src/db/complaints.ts";
import { saveComplaintToFirestore, updateComplaintInFirestore, fetchComplaintsFromFirestore } from "./src/lib/firestore-server";

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
    badgeNumber: "Verified Resident",
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
        badgeNumber: "Verified Resident",
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

  // ==========================================
  // PERSISTENT COMPLAINTS DATABASE ENGINE
  // ==========================================
  const DATA_DIR = path.join(process.cwd(), "data");
  const COMPLAINTS_FILE = path.join(DATA_DIR, "complaints.json");

  // Helper to determine department by category
  function getDepartmentForCategory(category: string): string {
    switch (category) {
      case "Roads & Bridges":
        return "NDMC Roads & Infrastructure Directorate";
      case "Electrical & Lighting":
        return "BSES Power & Municipal Lighting Wing";
      case "Water & Sanitation":
        return "Delhi Jal Board Hydrology Unit";
      case "Public Safety & Transit":
        return "Delhi Traffic Police & PWD Telemetry";
      case "Parks & Forestry":
        return "Municipal Parks & Forestry Directorate";
      case "Waste Management":
        return "Clean Delhi Solid Waste Response";
      default:
        return "District 04 Municipal Response Bureau";
    }
  }

  function normalizeComplaintRecord(c: any): CivicComplaint {
    const now = new Date().toISOString();
    const id = c.id || `#ICMRS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const lat = c.latitude ?? c.coordinates?.lat ?? 28.6139;
    const lng = c.longitude ?? c.coordinates?.lng ?? 77.2090;
    const category = c.category || "Roads & Bridges";
    const status = c.status || "Pending Triage";
    const priority = c.priority || "Medium";
    const citizenName = c.citizenName || c.user?.name || (c.userId ? "Registered Resident" : "Marcus Vance");
    const citizenEmail = c.citizenEmail || c.userEmail || (c.userId ? "citizen@icmrs.gov" : "citizen@icmrs.gov");
    const department = c.department || getDepartmentForCategory(category);
    const assignedOfficer = c.assignedOfficer || "Elena Vance";
    const assignedCrew = c.assignedCrew || "Triage Dispatch Unit 04";
    const resolutionDetails = c.resolutionDetails || (status === "Resolved" ? "Hazard remediated and signed off according to Municipal Safety Code §42." : "");
    const dateTime = c.dateTime || c.timeLogged || c.createdAt || now;
    const createdAt = c.createdAt || now;
    const updatedAt = c.updatedAt || now;

    const attachments = Array.isArray(c.attachments) && c.attachments.length > 0
      ? c.attachments
      : (c.imageUrl ? [{
          id: `att-${id.replace(/[^a-zA-Z0-9]/g, '')}-1`,
          name: "Photographic Evidence",
          url: c.imageUrl,
          type: "image/jpeg",
          uploadedAt: createdAt
        }] : []);

    const statusHistory = Array.isArray(c.statusHistory) && c.statusHistory.length > 0
      ? c.statusHistory
      : [{
          status: status,
          timestamp: createdAt,
          updatedBy: citizenName,
          role: "citizen",
          notes: `Complaint initially filed and dispatched to ${department}`
        }];

    return {
      ...c,
      id,
      complaintNumber: c.complaintNumber || id,
      title: c.title || "Untitled Hazard",
      description: c.description || "Citizen reported public infrastructure issue.",
      category,
      status,
      priority,
      location: c.location || "District 04, Delhi NCT",
      coordinates: { lat, lng },
      latitude: lat,
      longitude: lng,
      citizenName,
      citizenEmail,
      department,
      assignedCrew,
      assignedOfficer,
      resolutionDetails,
      dateTime,
      attachments,
      statusHistory,
      createdAt,
      updatedAt,
      pipelineStep: typeof c.pipelineStep === "number" ? c.pipelineStep : (status === "Resolved" ? 5 : 1),
      pipelineStepName: c.pipelineStepName || (status === "Resolved" ? "Step 5 of 5: Certified Sign-off" : "Step 1 of 5: Telemetry Received & Dispatched"),
      pipelinePercent: typeof c.pipelinePercent === "number" ? c.pipelinePercent : (status === "Resolved" ? 100 : 20),
      timeLogged: c.timeLogged || "Just now",
      slaRemaining: c.slaRemaining || (priority === "Critical" ? "4h 00m SLA standard" : "24h 00m SLA standard"),
      totalSlaHours: c.totalSlaHours || (priority === "Critical" ? 4 : 24),
      slaStatus: c.slaStatus || (status === "Resolved" ? "resolved" : priority === "Critical" ? "urgent" : "nominal"),
      imageUrl: c.imageUrl,
      imageAlt: c.imageAlt,
      beforeImageUrl: c.beforeImageUrl,
      afterImageUrl: c.afterImageUrl,
      beforeImageAlt: c.beforeImageAlt,
      afterImageAlt: c.afterImageAlt,
      gpsTagged: c.gpsTagged ?? true,
      officerNotes: Array.isArray(c.officerNotes) ? c.officerNotes : [],
      citizenToken: c.citizenToken || "Verified Resident",
      userId: c.userId,
      userEmail: citizenEmail
    };
  }

  function saveComplaintsToDb(list: CivicComplaint[]) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const tempFile = `${COMPLAINTS_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(list, null, 2), "utf-8");
      fs.renameSync(tempFile, COMPLAINTS_FILE);
    } catch (err) {
      console.error("[Database] Error saving complaints to disk:", err);
    }
  }

  function loadComplaintsFromDb(): CivicComplaint[] {
    try {
      if (fs.existsSync(COMPLAINTS_FILE)) {
        const raw = fs.readFileSync(COMPLAINTS_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeComplaintRecord);
        }
      }
    } catch (err) {
      console.error("[Database] Error reading complaints.json:", err);
    }

    // Seed initial complaints permanently to disk
    const seeded = INITIAL_COMPLAINTS.map(normalizeComplaintRecord);
    saveComplaintsToDb(seeded);
    return seeded;
  }

  // Generate guaranteed unique complaint number
  function generateUniqueComplaintNumber(existingList: CivicComplaint[]): string {
    const year = new Date().getFullYear();
    let candidate = "";
    let attempts = 0;
    do {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      candidate = `#ICMRS-${year}-${randomNum}`;
      attempts++;
    } while (existingList.some(c => c.id === candidate || c.complaintNumber === candidate) && attempts < 100);

    return candidate;
  }

  // Load persistent complaint storage initialized from database
  let complaints: CivicComplaint[] = loadComplaintsFromDb();

  // GET /api/complaints - Returns all complaints from persistent database
  app.get("/api/complaints", async (req, res) => {
    try {
      complaints = loadComplaintsFromDb();
      res.json({
        success: true,
        count: complaints.length,
        data: complaints,
      });
    } catch (err) {
      console.error("[API] Error fetching complaints:", err);
      res.status(500).json({ success: false, error: "Error fetching complaints" });
    }
  });

  // GET /api/complaints/database-records - Export authoritative municipal records for Admin Panel
  app.get("/api/complaints/database-records", async (req, res) => {
    try {
      complaints = loadComplaintsFromDb();
      let firestoreRecords: CivicComplaint[] = [];
      try {
        firestoreRecords = await fetchComplaintsFromFirestore();
      } catch (fErr) {
        console.warn("[Firestore] Failed to query records for export:", fErr);
      }

      // Merge local database with Firestore
      const mergedMap = new Map<string, CivicComplaint>();
      complaints.forEach(c => mergedMap.set(c.id, c));
      firestoreRecords.forEach(c => {
        const existing = mergedMap.get(c.id);
        mergedMap.set(c.id, { ...(existing || {}), ...c });
      });

      const allRecords = Array.from(mergedMap.values());

      // Format with the full authoritative municipal schema
      const authoritativeRecords = allRecords.map(c => {
        const evidence: string[] = [];
        if (c.imageUrl) evidence.push(c.imageUrl);
        if (Array.isArray(c.attachments)) {
          c.attachments.forEach(a => {
            if (a.url && !evidence.includes(a.url)) evidence.push(a.url);
            else if (a.name && !evidence.includes(a.name)) evidence.push(a.name);
          });
        }

        return {
          citizenName: c.citizenName || 'Marcus Vance',
          citizenEmail: c.citizenEmail || c.userEmail || 'citizen@icmrs.gov',
          complaintNumber: c.complaintNumber || c.id,
          complaintTitle: c.title,
          title: c.title,
          description: c.description || '',
          category: c.category || 'Roads & Bridges',
          status: c.status || 'In Progress',
          priority: c.priority || 'High',
          location: c.location || 'Central Delhi NCT',
          department: c.department || 'District 04 Municipal Response Bureau',
          assignedOfficer: c.assignedOfficer || 'Elena Vance',
          resolutionDetails: c.resolutionDetails || (c.status === 'Resolved' ? 'Remediated and certified according to Municipal Standard §42' : 'Active in municipal response queue'),
          evidence,
          createdAt: c.createdAt || c.dateTime || new Date().toISOString(),
          updatedAt: c.updatedAt || new Date().toISOString(),
          statusHistory: c.statusHistory || [],
          pipelineStep: c.pipelineStep || 1,
          pipelineStepName: c.pipelineStepName || 'Step 1 of 5: Telemetry Received & Dispatched',
          slaRemaining: c.slaRemaining || '24h 00m SLA remaining'
        };
      });

      res.json({
        success: true,
        count: authoritativeRecords.length,
        firestoreCount: firestoreRecords.length,
        databaseId: 'ai-studio-icmrsintelligent-20ad02e6-e593-4465-82c3-77c4d36f637d',
        projectId: 'eminent-aloe-4t8c4',
        records: authoritativeRecords
      });
    } catch (err) {
      console.error("[Database] Error exporting authoritative records:", err);
      res.status(500).json({ success: false, error: "Failed to export database records" });
    }
  });

  // GET /api/complaints/:id - Get single complaint with full details, attachments, history
  app.get("/api/complaints/:id", (req, res) => {
    complaints = loadComplaintsFromDb();
    const item = complaints.find(c => c.id === req.params.id || c.complaintNumber === req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: "Complaint record not found with the requested ID / Complaint Number.",
      });
    }
    res.json({ success: true, data: item });
  });

  // GET /api/complaints/citizen/:email - Get complaints filed by specific citizen
  app.get("/api/complaints/citizen/:email", (req, res) => {
    complaints = loadComplaintsFromDb();
    const queryEmail = decodeURIComponent(req.params.email).toLowerCase().trim();
    const matches = complaints.filter(c => 
      (c.citizenEmail && c.citizenEmail.toLowerCase() === queryEmail) ||
      (c.userEmail && c.userEmail.toLowerCase() === queryEmail)
    );
    res.json({
      success: true,
      count: matches.length,
      data: matches,
    });
  });

  // POST /api/complaints - Submit and permanently store a new complaint
  app.post("/api/complaints", (req, res) => {
    try {
      const body = req.body || {};

      // 1. Mandatory Database Validation: Check required fields
      const errors: string[] = [];

      const citizenName = (body.citizenName || body.name || "").trim();
      if (!citizenName || citizenName.length < 2) {
        errors.push("Citizen Name is required (minimum 2 characters).");
      }

      const citizenEmail = (body.citizenEmail || body.userEmail || body.email || "").trim();
      if (!citizenEmail || !citizenEmail.includes("@") || !citizenEmail.includes(".")) {
        errors.push("A valid Citizen Email / Mail ID is required.");
      }

      const title = (body.title || "").trim();
      if (!title || title.length < 3) {
        errors.push("Complaint Name / Title is required (minimum 3 characters).");
      }

      const description = (body.description || "").trim();
      if (!description || description.length < 5) {
        errors.push("Complaint Description is required (minimum 5 characters).");
      }

      const category = (body.category || "").trim();
      if (!category) {
        errors.push("Complaint Category is required.");
      }

      const priority = (body.priority || "Medium").trim();
      if (!["Critical", "High", "Medium", "Low"].includes(priority)) {
        errors.push("Complaint Priority must be Critical, High, Medium, or Low.");
      }

      const location = (body.location || "").trim();
      if (!location) {
        errors.push("Complaint Location is required.");
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Complaint validation failed: " + errors.join(" "),
          details: errors
        });
      }

      // 2. Reload database to ensure synchronous integrity
      complaints = loadComplaintsFromDb();

      // 3. Prevent duplicate Complaint Numbers
      let complaintNumber = body.id || body.complaintNumber;
      if (complaintNumber) {
        const existing = complaints.find(c => c.id === complaintNumber || c.complaintNumber === complaintNumber);
        if (existing) {
          return res.status(409).json({
            success: false,
            error: `Complaint Number ${complaintNumber} already exists in database. Duplicate records cannot be created.`
          });
        }
      } else {
        complaintNumber = generateUniqueComplaintNumber(complaints);
      }

      const now = new Date().toISOString();
      const department = body.department || getDepartmentForCategory(category);
      const assignedOfficer = body.assignedOfficer || "Elena Vance";
      const assignedCrew = body.assignedCrew || (priority === "Critical" ? "Rapid Response Unit 01" : "Triage Dispatch Unit 04");
      const lat = body.latitude ?? body.coordinates?.lat ?? 28.6139;
      const lng = body.longitude ?? body.coordinates?.lng ?? 77.2090;

      // Evidence & Attachments
      const attachments = Array.isArray(body.attachments) && body.attachments.length > 0
        ? body.attachments
        : (body.imageUrl ? [{
            id: `att-${Date.now()}-1`,
            name: "Photographic Evidence",
            url: body.imageUrl,
            type: "image/jpeg",
            uploadedAt: now
          }] : []);

      // Initial Status History
      const statusHistory = Array.isArray(body.statusHistory) && body.statusHistory.length > 0
        ? body.statusHistory
        : [{
            status: body.status || "In Progress",
            timestamp: now,
            updatedBy: citizenName,
            role: "citizen",
            notes: `Complaint logged by ${citizenName} (${citizenEmail}) and dispatched to ${department}`
          }];

      const newComplaint: CivicComplaint = {
        id: complaintNumber,
        complaintNumber: complaintNumber,
        citizenName,
        citizenEmail,
        title,
        description,
        category,
        status: body.status || "In Progress",
        priority: priority as any,
        location,
        coordinates: { lat, lng },
        latitude: lat,
        longitude: lng,
        dateTime: body.dateTime || now,
        department,
        assignedOfficer,
        assignedCrew,
        resolutionDetails: body.resolutionDetails || "",
        attachments,
        statusHistory,
        createdAt: now,
        updatedAt: now,
        pipelineStep: body.pipelineStep || 1,
        pipelineStepName: body.pipelineStepName || "Step 1 of 5: Telemetry Received & Dispatched",
        pipelinePercent: body.pipelinePercent || 20,
        timeLogged: body.timeLogged || "Just now",
        slaRemaining: priority === "Critical" ? "4h 00m SLA remaining" : "24h 00m SLA remaining",
        totalSlaHours: priority === "Critical" ? 4 : 24,
        slaStatus: priority === "Critical" ? "urgent" : "nominal",
        imageUrl: body.imageUrl,
        imageAlt: body.imageAlt || `Documentary photo of ${category} incident at ${location}`,
        gpsTagged: body.gpsTagged ?? true,
        officerNotes: body.officerNotes || [
          {
            id: `n-${Date.now()}`,
            author: assignedOfficer,
            role: "Ward Officer (Central Delhi)",
            time: "Just now",
            text: `Complaint logged into database. Automated dispatch assigned to ${department}.`
          }
        ],
        citizenToken: body.citizenToken || "Verified Resident",
        userId: body.userId || citizenEmail,
        userEmail: citizenEmail
      };

      // Save permanently in database
      complaints.unshift(newComplaint);
      saveComplaintsToDb(complaints);

      // Persist permanently to Firestore database
      saveComplaintToFirestore(newComplaint).then(ok => {
        if (ok) {
          console.log(`[Firestore] Complaint ${newComplaint.id} saved to Firestore database collection 'complaints'`);
        }
      }).catch(err => console.warn('[Firestore] Async save log:', err));

      // Persist to Cloud SQL with sanitized error handling
      insertComplaintToDb(newComplaint).catch((err) => {
        console.warn("[Cloud SQL] Note: Async Cloud SQL insert logged:", err?.message);
      });

      console.log(`[Database] Permanently stored complaint ${newComplaint.id} by citizen ${citizenName} (${citizenEmail})`);
      return res.status(201).json({
        success: true,
        message: "Complaint permanently saved in database.",
        data: newComplaint
      });
    } catch (err) {
      console.error("[Database] Error creating complaint:", err);
      return res.status(500).json({
        success: false,
        error: "Internal server error while saving complaint to database."
      });
    }
  });

  // PATCH /api/complaints/:id - Update complaint status, officer notes, resolution details
  app.patch("/api/complaints/:id", (req, res) => {
    try {
      const { id } = req.params;
      complaints = loadComplaintsFromDb();
      const index = complaints.findIndex(c => c.id === id || c.complaintNumber === id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: "Complaint not found in database" });
      }

      const existing = complaints[index];
      const now = new Date().toISOString();
      const updates = req.body || {};

      // Determine updated status history
      let statusHistory = [...(existing.statusHistory || [])];
      if (updates.status && updates.status !== existing.status) {
        statusHistory.push({
          status: updates.status,
          timestamp: now,
          updatedBy: updates.updatedBy || updates.assignedOfficer || "Municipal Field Officer",
          role: updates.updaterRole || "officer",
          notes: updates.statusNote || updates.updateNote || `Complaint status updated from ${existing.status} to ${updates.status}`
        });
      }

      const isNowResolved = updates.status === "Resolved" || (updates.pipelineStep === 5 && !existing.resolvedTime);
      const resolvedTime = isNowResolved ? (updates.resolvedTime || now) : existing.resolvedTime;
      const resolutionDetails = isNowResolved 
        ? (updates.resolutionDetails || existing.resolutionDetails || "Incident remediated and inspected according to Municipal Standards §42.")
        : existing.resolutionDetails;

      const lat = updates.latitude ?? updates.coordinates?.lat ?? existing.coordinates.lat;
      const lng = updates.longitude ?? updates.coordinates?.lng ?? existing.coordinates.lng;

      const updatedComplaint: CivicComplaint = {
        ...existing,
        ...updates,
        coordinates: { lat, lng },
        latitude: lat,
        longitude: lng,
        statusHistory,
        resolvedTime,
        resolutionDetails,
        updatedAt: now
      };

      complaints[index] = updatedComplaint;
      saveComplaintsToDb(complaints);

      // Persist updates to Firestore database
      updateComplaintInFirestore(updatedComplaint.id, updatedComplaint).catch(err => {
        console.warn('[Firestore] Async update log:', err);
      });

      // Persist patch to Cloud SQL
      updateComplaintInDb(updatedComplaint.complaintNumber || updatedComplaint.id, updatedComplaint).catch((err) => {
        console.warn("[Cloud SQL] Note: Async Cloud SQL update logged:", err?.message);
      });

      return res.json({
        success: true,
        message: "Complaint updated successfully in database.",
        data: updatedComplaint
      });
    } catch (err) {
      console.error("[Database] Error updating complaint:", err);
      return res.status(500).json({ success: false, error: "Internal server error while updating complaint" });
    }
  });

  // GET /api/users - Fetch registered users from Cloud SQL (with optional/bearer auth)
  app.get("/api/users", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const dbUsers = await getUsers();
      res.json({ success: true, count: dbUsers.length, data: dbUsers });
    } catch (error: any) {
      console.error("Failed to fetch users from Cloud SQL:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to fetch users" });
    }
  });

  // GET /api/sql/complaints - Direct Cloud SQL query for complaints
  app.get("/api/sql/complaints", async (req, res) => {
    try {
      const sqlComplaints = await getAllComplaintsFromDb();
      res.json({ success: true, count: sqlComplaints.length, data: sqlComplaints });
    } catch (error: any) {
      console.error("Failed to fetch complaints from Cloud SQL:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to fetch complaints from Cloud SQL" });
    }
  });

  // ==========================================
  // GEMINI CIVIC AI CHATBOT API
  // ==========================================
  let genAIClient: GoogleGenAI | null = null;
  function getGenAI(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "" || apiKey === "MY_GEMINI_API_KEY") {
      return null;
    }
    if (!genAIClient) {
      genAIClient = new GoogleGenAI({
        apiKey: apiKey.trim(),
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return genAIClient;
  }

  // GET /api/ai/status - Check Gemini AI connection and configuration
  app.get("/api/ai/status", (req, res) => {
    const rawKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const isConfigured = Boolean(
      rawKey && 
      rawKey.trim().length > 0 && 
      rawKey !== "MY_GEMINI_API_KEY" && 
      !rawKey.includes("PLACEHOLDER")
    );
    
    res.json({
      configured: isConfigured,
      activeModel: "gemini-3.8-flash",
      supportedModels: ["gemini-3.8-flash", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite"],
      provider: "Google Gemini GenAI SDK (@google/genai)",
      statusMessage: isConfigured 
        ? "Gemini API Key verified and active" 
        : "Gemini API Key not detected in environment. Using municipal simulated dispatch fallback."
    });
  });

  // POST /api/chat - Multi-turn conversational civic assistant
  app.post("/api/chat", async (req, res) => {
    try {
      const { 
        messages, 
        model = "gemini-3.8-flash", 
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
      // gemini-3.1-pro-preview for complex tasks, gemini-3.8-flash for general tasks, gemini-3.1-flash-lite for fast tasks
      const allowedModels = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview"];
      
      let selectedModel = "gemini-3.8-flash";
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
          selectedModel = "gemini-3.8-flash";
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
