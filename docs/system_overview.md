# 🏗️ Initial System Structure & Backlog

❗️ Please complete this document carefully. It will help you structure your ideas early and plan your development efficiently. ❗️

---

## 1. Initial System Structure

Describe how you plan to divide the system technically.

---

### Required Components

- **Server**
  - Spring Boot REST API
  - Handles business logic and communication with other services

- **Client**
  - React / Angular / Vue.js frontend
  - Provides user interface and interacts with backend via REST

- **GenAI Service**
  - Python-based microservice (e.g., using LangChain)
  - Provides AI-powered functionality via defined API

- **Database**
  - Example: PostgreSQL, MongoDB
  - Handles persistent data storage

---

## 📊 UML Diagrams

You must include the following diagrams:

### 1. Analysis Object Model

- UML **class diagram**
- Shows core entities and relationships

### 2. Use Case Diagram

- Shows **actors** and **system interactions**
- Focus on user goals and system behavior

### 3. Top-Level Architecture

- UML **component diagram**
- Visualizes system structure and service interactions

💡 You can use tools like **Apollon** to create these diagrams.

---

## 2. First Product Backlog

Prepare an initial backlog as a Markdown table or GitHub Project.

### Example Structure

| ID  | Title               | Description                     | Priority | Assignee |
| --- | ------------------- | ------------------------------- | -------- | -------- |
| 1   | User Authentication | Implement login & registration  | High     |          |
| 2   | API Setup           | Create base Spring Boot project | High     |          |
| 3   | GenAI Endpoint      | Add summarization endpoint      | Medium   |          |
| 4   | UI Layout           | Create main frontend layout     | Medium   |          |

- Each item should represent a **feature or task**
- Keep descriptions **clear and concise**
- Update backlog continuously as the project evolves

---

## 📅 Important Notes

- This document **must be stored in your team’s GitHub repository**
- It should be **updated regularly** as your system design evolves
