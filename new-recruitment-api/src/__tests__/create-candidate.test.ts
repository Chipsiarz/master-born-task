import request from "supertest";
import { Application } from "express";
import { setupApp } from "../app";
import { setupDb } from "../db";

describe("Candidate API", () => {
  let app: Application;

  beforeAll(async () => {
    const db = await setupDb();
    app = await setupApp(db);
  });

  it("should create a new candidate successfully", async () => {
    const candidateData = {
      firstName: "Jan",
      lastName: "Kowalski",
      email: "jan.kowalski@example.com",
      phone: "123456789",
      experienceYears: 5,
      notes: "Świetny kandydat",
      status: "nowy",
      consentDate: "2025-10-29",
      offers: [1, 2],
    };

    const res = await request(app).post("/candidates").send(candidateData);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message", "Candidate added successfully");
  });

  it("should not allow creating candidate without offers", async () => {
    const candidateData = {
      firstName: "Anna",
      lastName: "Nowak",
      email: "anna.nowak@example.com",
      phone: "987654321",
      experienceYears: 2,
      status: "nowy",
      consentDate: "2025-10-29",
      offers: [] as number[],
    };

    const res = await request(app).post("/candidates").send(candidateData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "Candidate must have at least one offer"
    );
  });

  it("should not allow creating candidate with duplicate email", async () => {
    const candidateData = {
      firstName: "Piotr",
      lastName: "Wiśniewski",
      email: "piotr@example.com",
      phone: "111222333",
      experienceYears: 4,
      status: "nowy",
      consentDate: "2025-10-29",
      offers: [1],
    };

    const res1 = await request(app).post("/candidates").send(candidateData);
    expect(res1.status).toBe(201);

    const res2 = await request(app).post("/candidates").send(candidateData);
    expect(res2.status).toBe(409);
    expect(res2.body).toHaveProperty(
      "message",
      "Candidate with this email already exists"
    );
  });

  it("should return paginated candidates list", async () => {
    const res = await request(app).get("/candidates?page=1&limit=2");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty("total");
  });

  it("should reject candidate missing required fields", async () => {
    const res = await request(app)
      .post("/candidates")
      .send({
        firstName: "NoEmail",
        lastName: "Tester",
        phone: "999888777",
        experienceYears: 3,
        status: "nowy",
        consentDate: "2025-10-29",
        offers: [1],
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Missing required field/);
  });

  it("should call legacy API when creating a new candidate", async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    (global as any).fetch = mockFetch;

    const candidateData = {
      firstName: "Krzysztof",
      lastName: "Maj",
      email: "krzysztof.maj@example.com",
      phone: "555333111",
      experienceYears: 6,
      status: "nowy",
      consentDate: "2025-10-29",
      offers: [1],
    };

    const res = await request(app).post("/candidates").send(candidateData);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message", "Candidate added successfully");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:4040/candidates",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: candidateData.firstName,
          lastName: candidateData.lastName,
          email: candidateData.email,
        }),
      })
    );
  });
});

