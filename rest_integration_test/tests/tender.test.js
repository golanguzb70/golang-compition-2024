const request = require("supertest");
const { faker } = require('@faker-js/faker');

const API_BASE_URL = "http://localhost:8888"; // Base URL of your API

describe("Tender Management", () => {
  let clientToken; // To store the JWT token for the client
  let contractorToken; // JWT token for contractor
  let tenderId;    // To store the created tender's ID

  // Register and login a client before running the tests
  beforeAll(async () => {
    // Generate random email and password for testing
    const generatedEmail = faker.internet.email();
    const password = faker.internet.password();

    // Register client user
    const registerPayload = {
      email: generatedEmail,
      password: password,
      role: "client",
      username: generatedEmail,
    };

    const registerResponse = await request(API_BASE_URL)
      .post("/register")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(registerPayload);

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body).toHaveProperty("token");

    // Login client user
    const loginPayload = {
      username: generatedEmail,
      password: password,
    };

    const loginResponse = await request(API_BASE_URL)
      .post("/login")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(loginPayload);

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty("token");

    clientToken = loginResponse.body.token;

    // Register and login a contractor
    const contractorEmail = faker.internet.email();
    const contractorPassword = faker.internet.password();

    // Register contractor user
    const contractorRegisterPayload = {
      email: contractorEmail,
      password: contractorPassword,
      role: "contractor",
      username: contractorEmail,
    };

    const contractorRegisterResponse = await request(API_BASE_URL)
      .post("/register")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(contractorRegisterPayload);

    expect(contractorRegisterResponse.status).toBe(201);
    expect(contractorRegisterResponse.body).toHaveProperty("token");

    // Login contractor user
    const contractorLoginPayload = {
      username: contractorEmail,
      password: contractorPassword,
    };

    const contractorLoginResponse = await request(API_BASE_URL)
      .post("/login")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(contractorLoginPayload);

    expect(contractorLoginResponse.status).toBe(200);
    expect(contractorLoginResponse.body).toHaveProperty("token");

    contractorToken = contractorLoginResponse.body.token;
  });

  test("Success create tender", async () => {
    const payload = {
      title: "New Tender",
      description: "Tender description",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      budget: 50000,
      // attachment: "path/to/attachment.pdf", // Optional
    };

    const response = await request(API_BASE_URL)
      .post("/api/client/tenders")
      .set("Authorization", `Bearer ${clientToken}`)
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.title).toBe(payload.title);
    tenderId = response.body.id; // Store tender ID for later tests
  });

  test("Fail create tender - Missing required fields", async () => {
    const payload = {
      title: "",
      description: "",
      deadline: "",
      budget: 0,
    };

    const response = await request(API_BASE_URL)
      .post("/api/client/tenders")
      .set("Authorization", `Bearer ${clientToken}`)
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Invalid input");
  });

  test("Fail create tender - Unauthorized", async () => {
    const payload = {
      title: "Unauthorized Tender",
      description: "Should not be created",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      budget: 10000,
    };

    const response = await request(API_BASE_URL)
      .post("/api/client/tenders")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(payload); // No Authorization header

    expect(response.status).toBe(401); // Unauthorized
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Missing token");
  });

  test("Success list tenders", async () => {
    const response = await request(API_BASE_URL)
      .get("/api/client/tenders")
      .set("Authorization", `Bearer ${clientToken}`)
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
  });

  test("Success update tender status", async () => {
    const payload = {
      status: "closed",
    };

    const response = await request(API_BASE_URL)
      .put(`/api/client/tenders/${tenderId}`)
      .set("Authorization", `Bearer ${clientToken}`)
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Tender status updated");
  });

  test("Fail update tender status - Invalid status", async () => {
    const payload = {
      status: "invalid_status",
    };

    const response = await request(API_BASE_URL)
      .put(`/api/client/tenders/${tenderId}`)
      .set("Authorization", `Bearer ${clientToken}`)
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Invalid tender status");
  });

  test("Fail update tender status - Unauthorized", async () => {
    const payload = {
      status: "closed",
    };

    const response = await request(API_BASE_URL)
      .put(`/api/client/tenders/${tenderId}`)
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(payload); // No Authorization header

    expect(response.status).toBe(401); // Unauthorized
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Missing token");
  });

  test("Fail create tender - Invalid budget and deadline", async () => {
    const payload = {
      title: "Tender with Invalid Data",
      description: "Invalid budget and deadline",
      deadline: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Past date
      budget: -1000, // Negative budget
    };

    const response = await request(API_BASE_URL)
      .post("/api/client/tenders")
      .set("Authorization", `Bearer ${clientToken}`)
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Invalid tender data");
  });

  test("Fail update tender status - Tender not found", async () => {
    const payload = {
      status: "closed",
    };

    const nonExistentTenderId = 999999; // Assuming this ID does not exist

    const response = await request(API_BASE_URL)
      .put(`/api/client/tenders/${nonExistentTenderId}`)
      .set("Authorization", `Bearer ${clientToken}`)
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(payload);

    expect(response.status).toBe(404); // Not Found
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Tender not found");
  });

  test("Success create tender with attachment", async () => {
    const payload = {
      title: "Tender with Attachment",
      description: "Tender description with attachment",
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
      budget: 75000,
      attachment: "path/to/attachment.pdf", // Assuming the API supports file uploads
    };

    // If using file uploads, you'd use .attach() with Supertest
    const response = await request(API_BASE_URL)
      .post("/api/client/tenders")
      .set("Authorization", `Bearer ${clientToken}`)
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.title).toBe(payload.title);
  });

  // **New Test Cases for Deleting Tenders**

  test("Success delete tender", async () => {
    const response = await request(API_BASE_URL)
      .delete(`/api/client/tenders/${tenderId}`)
      .set("Authorization", `Bearer ${clientToken}`)
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Tender deleted successfully");
  });

  test("Fail delete tender - Tender not found", async () => {
    const nonExistentTenderId = 999999; // Assuming this ID does not exist

    const response = await request(API_BASE_URL)
      .delete(`/api/client/tenders/${nonExistentTenderId}`)
      .set("Authorization", `Bearer ${clientToken}`)
      .set("Accept", "application/json");

    expect(response.status).toBe(404); // Not Found
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Tender not found or access denied");
  });

  test("Fail delete tender - Unauthorized", async () => {
    const response = await request(API_BASE_URL)
      .delete(`/api/client/tenders/${tenderId}`)
      .set("Accept", "application/json"); // No Authorization header

    expect(response.status).toBe(401); // Unauthorized
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Missing token");
  });

  test("Fail delete tender - Tender already deleted", async () => {
    // Attempt to delete the tender that was already deleted
    const response = await request(API_BASE_URL)
      .delete(`/api/client/tenders/${tenderId}`)
      .set("Authorization", `Bearer ${clientToken}`)
      .set("Accept", "application/json");

    expect(response.status).toBe(404); // Not Found
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Tender not found or access denied");
  });
});