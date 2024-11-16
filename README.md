## Project: Tender Management Backend

### **Project Overview**:
The goal of this project is to build a backend system that manages tenders (procurement processes) and bids. Clients post tenders, contractors submit bids, and the system allows clients to review and award contracts to contractors based on bids. Participants will implement user authentication, role management, tender creation, bid submission, and bid evaluation features. 

### **Detailed Feature Breakdown**:

#### **1. User Authentication & Role Management**
   - **Description**: 
     - Implement registration and login functionality.
     - Users can either be a **client** or a **contractor**.
     - Clients can post tenders, while contractors can submit bids.
     - Ensure authentication via JWT or session-based tokens.
     - Role-based access control so only clients can create tenders, and only contractors can submit bids.
   
   - **Implementation Requirements**:
     - Registration endpoint (POST `/register`).
     - Login endpoint (POST `/login`).
     - Middleware to secure routes (check roles).
   
   - **Evaluation Criteria**:
     - Secure authentication.
     - Role-based access working as expected.

#### **2. Tender Posting (by Clients)**
   - **Description**: 
     - Clients should be able to create a new tender with details such as title, description, deadline, and budget.
     - A tender can have an optional file attachment (like PDFs with project specifications).
     - Tenders should have a status (e.g., “open,” “closed,” “awarded”).
     - Clients can list all their posted tenders and their statuses.
   
   - **Implementation Requirements**:
     - Create tender endpoint (POST `/tenders`).
     - List tenders (GET `/tenders`).
     - Update tender status (PUT `/tenders/:id`).
     - Delete tender (DELETE `/tenders/:id`)
   
   - **Evaluation Criteria**:
     - Clients can create and manage tenders.
     - Proper validation for tender creation (e.g., budget > 0, deadline is in the future).

#### **3. Bid Submission (by Contractors)**
   - **Description**: 
     - Contractors can submit bids on open tenders.
     - Each bid includes a proposed price, delivery time, and optional comments.
     - Contractors should be able to view all tenders and select ones they are interested in bidding for.
     - After submitting a bid, the system should notify the client.
   
   - **Implementation Requirements**:
     - Submit bid endpoint (POST `/tenders/:id/bids`).
     - View submitted bids (GET `/tenders/:id/bids`).
   
   - **Evaluation Criteria**:
     - Contractors can submit bids.
     - Proper validation of bid data (e.g., price > 0, delivery time > 0).

#### **4. Bid Filtering and Sorting**
   - **Description**: 
     - Allow clients to filter bids based on criteria like price, delivery time.
   
   - **Implementation Requirements**:
     - Filtering options on bid listing endpoint (GET `/tenders/:id/bids?price=<>&delivery_time=<>`).
     - Sorting by bid price or delivery time.

#### **5. Bid Evaluation and Tender Awarding**
   - **Description**: 
     - After the tender deadline, the client should be able to evaluate all bids submitted to a tender.
     - Clients can select a winning bid and award the tender.
     - Upon awarding, notify the winning contractor.
     - The tender should automatically transition to a "closed" or "awarded" status.
   
   - **Implementation Requirements**:
     - Award tender endpoint (POST `/tenders/:id/award/:bid_id`).
     - Notifications (push notifications).
   
   - **Evaluation Criteria**:
     - Clients can view bids, award a tender, and notify the contractor.
     - Tender status updates appropriately.

#### **6. Tender and Bid History**
   - **Description**: 
     - Both clients and contractors should be able to view the history of tenders they created, participated in, and the status of each tender and bid.
   
   - **Implementation Requirements**:
     - List user’s tender history (GET `/users/:id/tenders`).
     - List contractor’s bids (GET `/users/:id/bids`).
   
   - **Evaluation Criteria**:
     - Both clients and contractors can access their histories and see relevant information.

---

### **Bonus Features (Optional)**:

#### **1. Real-time Updates**
   - **Description**: 
     - Implement WebSockets to notify users.
   
   - **Implementation Requirements**:
     - Setup WebSockets for real-time notification.

#### **2. Rate Limiting**
   - **Description**: 
     - Implement rate limiting to prevent spamming the bid submission endpoint.
   
   - **Implementation Requirements**:
     - Rate limit bid submissions to 5 per minute per contractor.

#### **3. Caching **
   - **Description**:
     - Use caching to reduce server load when getting tenders and bids.
   
   - **Implementation Requirements**:
     - Cache results of frequently accessed APIs (like tender listings).
     - Cache expiration policy should be set correctly to provide data consistency.
---

### **Database Schema**:
1. **User** (id, username, password, role, email)
2. **Tender** (id, client_id, title, description, deadline, budget, status)
3. **Bid** (id, tender_id, contractor_id, price, delivery_time, comments, status)
4. **Notification** (id, user_id, message, relation_id, type, created_at)

---

### **Evaluation Criteria**:
- **Correctness**: 
  - The solution should meet all the functional requirements.
  - Code should handle edge cases such as invalid inputs, deadlines, and empty data sets.

- **Code Quality**: 
  - Clean, modular, and well-documented code.
  - Efficient database queries with proper indexing for large data.

- **Security**: 
  - Secure user authentication.
  - Proper role-based access control.

- **Performance**:
  - System should handle large data sets efficiently.
  - Tender and bid listings should load quickly.

- **Bonus Features**: 
  - Extra points for real-time notifications, advanced filtering, and analytics.

---


### **Technical requirements**:

#### **Your project should use the following technologies:**
- **Golang** for backend development.
- **PostgreSQL** or **MongoDB** for database management.
- **REST API** for communication between client and server.
- **Swagger** for API documentation.
- **Docker** for containerization.
- **Websocket** for real time updates.

#### **Project Run Instructions**
Your project must adhere to the following setup. **If these commands are not provided or functional, your project will not be evaluated.**

- **Database Setup:**  
  To start the database using Docker, execute the following command:
  ```bash
  make run_db
  ```

- **Run the Application:**  
  To start the entire project using Docker, run:
  ```bash
  make run
  ```

  This will spin up your Golang application in a container, along with any other required services.


The `Makefile` should handle all Docker-related tasks, ensuring the database and application are started properly using the `make run_db` and `make run` commands.


### **Grading creteria**:

| Category                         | Max Score |
|----------------------------------|-----------|
| Auto test                        | 100       |
| Real-time Updates                | 40        |
| Caching                          | 30        |
| Rate Limiting                    | 30        |
| **Total**                        | **200**   |