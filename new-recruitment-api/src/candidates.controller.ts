import { Request, Response, Router } from "express";
import { Database } from "sqlite";
import sqlite3 from "sqlite3";
import { Candidate } from "./types";

export class CandidatesController {
  readonly router = Router();
  private db: Database<sqlite3.Database, sqlite3.Statement>;

  constructor(db: Database<sqlite3.Database, sqlite3.Statement>) {
    this.db = db;
    this.router.get("/candidates", this.getAll.bind(this));
    this.router.post("/candidates", this.create.bind(this));
  }

  async getAll(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    try {
      const offset = (page - 1) * limit;
      const data = await this.db.all(
        `SELECT * FROM candidates LIMIT ? OFFSET ?`,
        limit,
        offset
      );

      const total = await this.db.get(
        `SELECT COUNT(*) as count FROM candidates`
      );

      res.json({
        total: total.count,
        page,
        limit,
        data: data.map((c) => ({
          ...c,
          offers: JSON.parse(c.offers),
        })),
      });
    } catch (err) {
      res.status(500).json({ message: "Database error", error: err });
    }
  }

  async create(req: Request, res: Response) {
    const candidate: Candidate = req.body;

    if (!candidate.offers || candidate.offers.length === 0) {
      return res
        .status(400)
        .json({ message: "Candidate must have at least one offer" });
    }

    try {
      await this.db.run(
        `INSERT INTO candidates 
          (firstName, lastName, email, phone, experienceYears, notes, status, consentDate, offers)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        candidate.firstName,
        candidate.lastName,
        candidate.email,
        candidate.phone,
        candidate.experienceYears,
        candidate.notes || null,
        candidate.status,
        candidate.consentDate,
        JSON.stringify(candidate.offers)
      );

      await fetch("http://localhost:4040/candidates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "",
        },
        body: JSON.stringify({
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
        }),
      });

      res.status(201).json({ message: "Candidate added successfully" });
    } catch (err: any) {
      if (err.code === "SQLITE_CONSTRAINT") {
        return res
          .status(409)
          .json({ message: "Candidate with this email already exists" });
      }
      res.status(500).json({ message: "Database error", error: err });
    }
  }
}

