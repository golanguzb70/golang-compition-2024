const request = require("supertest");
const { faker } = require('@faker-js/faker');

const API_BASE_URL = "http://localhost:8888"; // Base URL of your API

describe("Bid Management", () => {
  let clientToken;       // JWT token for client
  let contractorToken;   // JWT token for contractor
  let tenderId;          // ID of the tender created by the client
  let bidId;             // ID of the bid submitted by the contractor

  // Register and login a client and a contractor before running the tests
  beforeAll(async () => {
    // Client registration and login
    const clientEmail = faker.internet.email();
    const clientPassword = faker.internet.password();

    const clientRegisterPayload = {
      email: clientEmail,
      password: clientPassword,
      role: "client",
      username: clientEmail,
    };

    const clientRegisterResponse = await request(API_BASE_URL)
      .post("/register")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(clientRegisterPayload);

    expect(clientRegisterResponse.status).toBe(201);
    expect(clientRegisterResponse.body).toHaveProperty("token");

    const clientLoginPayload = {
      username: clientEmail,
      password: clientPassword,
    };

    const clientLoginResponse = await request(API_BASE_URL)
      .post("/login")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(clientLoginPayload);

    expect(clientLoginResponse.status).toBe(200);
    expect(clientLoginResponse.body).toHaveProperty("token");

    clientToken = clientLoginResponse.body.token;

    // Contractor registration and login
    const contractorEmail = faker.internet.email();
    const contractorPassword = faker.internet.password();

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

    // Client creates a tender
    const tenderPayload = {
      title: "Test Tender",
      description: "This is a test tender",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      budget: 50000,
    };

    const tenderResponse = await request(API_BASE_URL)
      .post("/api/client/tenders")
      .set("Authorization", `Bearer ${clientToken}`)
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(tenderPayload);

    expect(tenderResponse.status).toBe(201);
    expect(tenderResponse.body).toHaveProperty("id");

    tenderId = tenderResponse.body.id;
  });

  // **Tests for Submitting a Bid**

  test("Success submit bid", async () => {
    const bidPayload = {
      price: 45000,
      delivery_time: 30, // days
      comments: "We can deliver in 30 days.",
      
    };

    const response = await request(API_BASE_URL)
      .post(`/api/contractor/tenders/${tenderId}/bid`)
      .set("Authorization", `Bearer ${contractorToken}`)
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(bidPayload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.price).toBe(bidPayload.price);
    bidId = response.body.id;
  });

  test("Fail submit bid - Missing required fields", async () => {
    const bidPayload = {
      price: 0,
      delivery_time: 0,
      comments: "",
    };

    const response = await request(API_BASE_URL)
      .post(`/api/contractor/tenders/${tenderId}/bid`)
      .set("Authorization", `Bearer ${contractorToken}`)
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(bidPayload);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Invalid bid data");
  });

  test("Fail submit bid - Tender not found", async () => {
    const bidPayload = {
      price: 50000,
      delivery_time: 25,
      comments: "Bid for non-existent tender",
    };

    const nonExistentTenderId = 999999; // Assuming this ID does not exist

    const response = await request(API_BASE_URL)
      .post(`/api/contractor/tenders/${nonExistentTenderId}/bid`)
      .set("Authorization", `Bearer ${contractorToken}`)
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(bidPayload);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Tender not found");
  });

  test("Fail submit bid - Tender not open", async () => {
    // First, close the tender
    const payload = {
      status: "closed",
    };

    const updateResponse = await request(API_BASE_URL)
      .put(`/api/client/tenders/${tenderId}`)
      .set("Authorization", `Bearer ${clientToken}`)
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(payload);

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toHaveProperty("message");

    // Attempt to submit a bid to the closed tender
    const bidPayload = {
      price: 40000,
      delivery_time: 20,
      comments: "Bid for closed tender",
    };

    const response = await request(API_BASE_URL)
      .post(`/api/contractor/tenders/${tenderId}/bid`)
      .set("Authorization", `Bearer ${contractorToken}`)
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(bidPayload);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Tender is not open for bids");

    // Re-open the tender for further tests
    const reopenPayload = {
      status: "open",
    };

    await request(API_BASE_URL)
      .put(`/api/client/tenders/${tenderId}`)
      .set("Authorization", `Bearer ${clientToken}`)
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(reopenPayload);
  });

  test("Fail submit bid - Unauthorized", async () => {
    const bidPayload = {
      price: 45000,
      delivery_time: 30,
      comments: "Unauthorized bid",
    };

    const response = await request(API_BASE_URL)
      .post(`/api/contractor/tenders/${tenderId}/bid`)
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(bidPayload); // No Authorization header

    expect(response.status).toBe(401); // Unauthorized
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Missing token");
  });

  // **Tests for Viewing Bids**

  test("Contractor can view their own bids", async () => {
    const response = await request(API_BASE_URL)
      .get("/api/contractor/bids")
      .set("Authorization", `Bearer ${contractorToken}`)
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
  });

  test("Client can view bids for their tender", async () => {
    const response = await request(API_BASE_URL)
      .get(`/api/client/tenders/${tenderId}/bids`)
      .set("Authorization", `Bearer ${clientToken}`)
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
  });

  test("Fail view bids - Unauthorized", async () => {
    const response = await request(API_BASE_URL)
      .get(`/api/client/tenders/${tenderId}/bids`)
      .set("Accept", "application/json"); // No Authorization header

    expect(response.status).toBe(401); // Unauthorized
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Missing token");
  });

  test("Fail view bids - Tender not found or access denied", async () => {
    const nonExistentTenderId = 999999; // Assuming this ID does not exist

    const response = await request(API_BASE_URL)
      .get(`/api/client/tenders/${nonExistentTenderId}/bids`)
      .set("Authorization", `Bearer ${clientToken}`)
      .set("Accept", "application/json");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Tender not found or access denied");
  });

  // **Tests for Awarding a Bid**

  test("Client can award a bid", async () => {
    const response = await request(API_BASE_URL)
      .post(`/api/client/tenders/${tenderId}/award/${bidId}`)
      .set("Authorization", `Bearer ${clientToken}`)
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Bid awarded successfully");
  });

  test("Fail award bid - Bid not found", async () => {
    const nonExistentBidId = 999999; // Assuming this ID does not exist

    const response = await request(API_BASE_URL)
      .post(`/api/client/tenders/${tenderId}/award/${nonExistentBidId}`)
      .set("Authorization", `Bearer ${clientToken}`)
      .set("Accept", "application/json");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Bid not found");
  });

  test("Fail award bid - Tender not found or access denied", async () => {
    const nonExistentTenderId = 999999; // Assuming this ID does not exist

    const response = await request(API_BASE_URL)
      .post(`/api/client/tenders/${nonExistentTenderId}/award/${bidId}`)
      .set("Authorization", `Bearer ${clientToken}`)
      .set("Accept", "application/json");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Tender not found or access denied");
  });

  test("Fail award bid - Unauthorized", async () => {
    const response = await request(API_BASE_URL)
      .post(`/api/client/tenders/${tenderId}/award/${bidId}`)
      .set("Accept", "application/json"); // No Authorization header

    expect(response.status).toBe(401); // Unauthorized
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Missing token");
  });

  // **Tests for Deleting a Bid**

  test("Contractor can delete their bid", async () => {
    const response = await request(API_BASE_URL)
      .delete(`/api/contractor/bids/${bidId}`)
      .set("Authorization", `Bearer ${contractorToken}`)
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Bid deleted successfully");
  });

  test("Fail delete bid - Bid not found or access denied", async () => {
    const nonExistentBidId = 999999; // Assuming this ID does not exist

    const response = await request(API_BASE_URL)
      .delete(`/api/contractor/bids/${nonExistentBidId}`)
      .set("Authorization", `Bearer ${contractorToken}`)
      .set("Accept", "application/json");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Bid not found or access denied");
  });

  test("Fail delete bid - Unauthorized", async () => {
    const response = await request(API_BASE_URL)
      .delete(`/api/contractor/bids/${bidId}`)
      .set("Accept", "application/json"); // No Authorization header

    expect(response.status).toBe(401); // Unauthorized
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Missing token");
  });

  test("Fail delete bid - Attempt to delete someone else's bid", async () => {
    // Another contractor registers and logs in
    const anotherContractorEmail = faker.internet.email();
    const anotherContractorPassword = faker.internet.password();

    const anotherContractorRegisterPayload = {
      email: anotherContractorEmail,
      password: anotherContractorPassword,
      role: "contractor",
      username: anotherContractorEmail,
    };

    const anotherContractorRegisterResponse = await request(API_BASE_URL)
      .post("/register")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(anotherContractorRegisterPayload);

    expect(anotherContractorRegisterResponse.status).toBe(201);
    expect(anotherContractorRegisterResponse.body).toHaveProperty("token");

    const anotherContractorLoginPayload = {
      username: anotherContractorEmail,
      password: anotherContractorPassword,
    };

    const anotherContractorLoginResponse = await request(API_BASE_URL)
      .post("/login")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(anotherContractorLoginPayload);

    expect(anotherContractorLoginResponse.status).toBe(200);
    expect(anotherContractorLoginResponse.body).toHaveProperty("token");

    const anotherContractorToken = anotherContractorLoginResponse.body.token;

    // Another contractor attempts to delete the bid
    const response = await request(API_BASE_URL)
      .delete(`/api/contractor/bids/${bidId}`)
      .set("Authorization", `Bearer ${anotherContractorToken}`)
      .set("Accept", "application/json");

    expect(response.status).toBe(404); // Not Found or Access Denied
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Bid not found or access denied");
  });

  test("Fail award bid - Client awarding bid for someone else's tender", async () => {
    // Another client registers and logs in
    const anotherClientEmail = faker.internet.email();
    const anotherClientPassword = faker.internet.password();

    const anotherClientRegisterPayload = {
      email: anotherClientEmail,
      password: anotherClientPassword,
      role: "client",
      username: anotherClientEmail,
    };

    const anotherClientRegisterResponse = await request(API_BASE_URL)
      .post("/register")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(anotherClientRegisterPayload);

    expect(anotherClientRegisterResponse.status).toBe(201);
    expect(anotherClientRegisterResponse.body).toHaveProperty("token");

    const anotherClientLoginPayload = {
      username: anotherClientEmail,
      password: anotherClientPassword,
    };

    const anotherClientLoginResponse = await request(API_BASE_URL)
      .post("/login")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send(anotherClientLoginPayload);

    expect(anotherClientLoginResponse.status).toBe(200);
    expect(anotherClientLoginResponse.body).toHaveProperty("token");

    const anotherClientToken = anotherClientLoginResponse.body.token;

    // Another client attempts to award a bid for the tender
    const response = await request(API_BASE_URL)
      .post(`/api/client/tenders/${tenderId}/award/${bidId}`)
      .set("Authorization", `Bearer ${anotherClientToken}`)
      .set("Accept", "application/json");

    expect(response.status).toBe(404); // Not Found or Access Denied
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Tender not found or access denied");
  });

});