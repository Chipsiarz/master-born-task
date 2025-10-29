import express from "express";
import { CandidatesController } from "./candidates.controller";
import { Database } from "sqlite";
import sqlite3 from "sqlite3";

export const setupApp = async (
  db: Database<sqlite3.Database, sqlite3.Statement>
) => {
  const app = express();
  app.use(express.json());
  app.use(new CandidatesController(db).router);
  return app;
};

