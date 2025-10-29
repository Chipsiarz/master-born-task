import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";
import { Candidate } from "./types";

let db: Database<sqlite3.Database, sqlite3.Statement>;

export const setupDb = async () => {
  db = await open({
    filename: ":memory:",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      experienceYears INTEGER NOT NULL,
      notes TEXT,
      status TEXT NOT NULL,
      consentDate TEXT NOT NULL,
      offers TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobOffers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      department TEXT NOT NULL
    );
  `);

  await db.run(`INSERT INTO jobOffers (title, department) VALUES 
    ('Frontend Developer', 'IT'),
    ('Backend Developer', 'IT'),
    ('HR Specialist', 'HR'),
    ('QA Engineer', 'Quality Assurance')
  `);

  return db;
};

export async function addCandidate(candidate: Candidate) {
  await db.run(
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
}

export async function getCandidates(page: number, limit: number) {
  const offset = (page - 1) * limit;
  const data = await db.all(
    `SELECT * FROM candidates LIMIT ? OFFSET ?`,
    limit,
    offset
  );

  const total = await db.get(`SELECT COUNT(*) as count FROM candidates`);
  return {
    total: total.count,
    data: data.map((c) => ({
      ...c,
      offers: JSON.parse(c.offers),
    })),
  };
}

