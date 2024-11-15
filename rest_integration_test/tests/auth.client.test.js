const request = require("supertest");
const { faker } = require('@faker-js/faker');

const API_BASE_URL = "http://localhost:8888"; // Base URL of your API

describe("Authorization Client", () => {
  // Generate random email and password for testing
  const generatedEmail = faker.internet.email();
  const password = faker.internet.password();

  test("Success register user", async () => {
    const payload = {
      email: generatedEmail,
      password: password,
      user_type: "client",
      username: generatedEmail, // Use part of email as username
    };

    const response = await request(API_BASE_URL)
      .post("/register")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(payload);

    expect(response.status).toBe(201); // Successful registration
    expect(response.body).toHaveProperty("token"); // Token is returned
  });

  test("Fail register user - Missing required fields", async () => {
    const payload = {
      email: "", // Missing email
      password: "1234",
      user_type: "client",
      username: "",
    };

    const response = await request(API_BASE_URL)
      .post("/register")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(payload);

    expect(response.status).toBe(400); // Validation error
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("username or email cannot be empty");
  });

  test("Fail register user - Duplicate email", async () => {
    const payload = {
      email: generatedEmail, // Same email as before
      password: faker.internet.password(),
      user_type: "client",
      username: generatedEmail,
    };

    const response = await request(API_BASE_URL)
      .post("/register")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(payload);

    expect(response.status).toBe(400); // Conflict error for duplicate email
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Email already exists");
  });

  test("Fail register user - Invalid email format", async () => {
    const payload = {
      email: "invalid-email", // Invalid email format
      password: password,
      user_type: "client",
      username: "testUser",
    };

    const response = await request(API_BASE_URL)
      .post("/register")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(payload);

    expect(response.status).toBe(400); // Validation error
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("invalid email format");
  });

  test("Success login user", async () => {
    const payload = {
      username: generatedEmail,
      password: password,
    };

    const response = await request(API_BASE_URL)
      .post("/login")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(payload);

    expect(response.status).toBe(200); // Successful login
    expect(response.body).toHaveProperty("token"); // Token is returned
  });

  test("Fail login user - Incorrect password", async () => {
    const payload = {
      username: generatedEmail,
      password: "wrong-password",
    };

    const response = await request(API_BASE_URL)
      .post("/login")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(payload);

    expect(response.status).toBe(401); // Unauthorized
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Invalid username or password");
  });

  test("Fail login user - User not found", async () => {
    const payload = {
      username: "nonexistent@example.com",
      password: "random-password",
    };

    const response = await request(API_BASE_URL)
      .post("/login")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(payload);

    expect(response.status).toBe(404); // Not found
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("User not found");
  });

  test("Fail login user - Missing required fields", async () => {
    const payload = {
      username: "",
      password: "",
    };

    const response = await request(API_BASE_URL)
      .post("/login")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(payload);

    expect(response.status).toBe(400); // Validation error
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Username and password are required");
  });
});
