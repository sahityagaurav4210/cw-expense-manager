# Software Requirements Specification (SRS)
## CW Expense Tracker Application

**Document Version:** 1.0.0  
**Author:** Gaurav Sahitya  
**Date:** October 2026  
**Status:** Approved & Implemented  

---

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to specify the Software Requirements Specification (SRS) for the **CW Expense Tracker Application**. This document provides a complete technical and functional description of the system, including functional requirements, data DTO rules, non-functional requirements, external service integrations, and architectural constraints.

### 1.2 Scope
The CW Expense Tracker is a multi-tier web application that enables users to record, categorize, track, and analyze their personal daily expenses against an allocated monthly income budget. The system provides real-time dashboard analytics, category management, monthly income allocation, PDF financial reporting, CAPTCHA security, and separate user and admin interfaces complying with W3C WCAG 2.1 and Government of India Guidelines for Websites (GIGW) standards.

### 1.3 Target Audience & User Classes
1. **Registered Users (Client Frontend):** Normal users managing income budgets, categories, and expense records.
2. **System Administrators (Admin Panel):** Administrators overseeing category masters, auditing user accounts, and monitoring VAPT security logs.

---

## 2. Overall Description

### 2.1 System Architecture
The application follows a decoupled microservice architecture:
- **Client Frontend (`frontend`):** Fully responsive React.js web application.
- **Admin Panel (`admin-panel`):** React.js admin portal compliant with W3C WCAG & GIGW standards.
- **Backend for Frontend (`bff`):** Node.js Express proxy service handling HTTP-Only cookies, rate limiting, and log rotation.
- **API Gateway (`api-gateway`):** Central entry gateway with route forwarding, CORS, and Slf4j/Winston logging.
- **Backend Microservice (`backend`):** Express + TypeScript backend with Sequelize ORM (PostgreSQL), Redis caching, Helmet security, Bcrypt.js, and AES-256 encryption.
- **External CAPTCHA Service:** Service running at `http://localhost:11905`.

---

## 3. Specific Functional Requirements

### 3.1 User Registration
- **Name:** Required, max 32 characters, letters and spaces only, no special characters allowed.
- **Email:** Required, max 32 characters, valid RFC format.
- **Phone Number:** Optional, max 10 characters, valid Indian numbers starting with 6-9 (`/^[6-9]\d{9}$/`).
- **Password:** Required, 8-25 characters, minimum 1 uppercase letter, 1 lowercase letter, and 1 special symbol.
- **Employment Type:** Required, dropdown choices: `Salaried`, `Self-Employed`.
- **CAPTCHA:** Required, max 8 characters.
- **Profile Photo:** Optional, max 1MB size limit, allowed formats `*.jpg`, `*.jpeg`, `*.png` with client-side header magic bytes verification (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG).

### 3.2 User Login
- **Email Address:** Required.
- **Password:** Required.
- **CAPTCHA Text:** Required.
- **Session Management:** Secure HTTP-Only cookies carrying JWT tokens.

### 3.3 Category Management
- **Category Name:** Required, max 100 characters, allowed characters: letters, numbers, dash (`-`), underscore (`_`), space, and forward slash (`/`).
- **Active Flag:** Boolean, toggleable by user, maintained by backend.
- **Delete Flag:** Boolean, soft deletion handling maintained by backend.
- **CAPTCHA Text:** Required for creation, toggling, and deletion.

### 3.4 Budget Allocation
- **Monthly Income Amount:** Required, numbers only, no scientific notation (`e`/`E`).
- **From Date & To Date:** Required, `YYYY-MM-DD` date picker format.
- **CAPTCHA Text:** Required.

### 3.5 Expense Management
- **Expense Name:** Required, max 64 characters, letters and numbers only.
- **Expense Amount:** Required, positive number, no scientific notation.
- **Expense Category:** Optional autocomplete selection from category master, defaults to "Not Defined".
- **Expense Type:** Required selection: `Fixed` or `Variable`.
- **Expense Date:** Optional, `YYYY-MM-DD`.
- **CAPTCHA Text:** Required.

### 3.6 User Dashboard
- Visual metrics showing **Allocated Monthly Income**, **Total Incurred Expense**, and **Remaining Money Left**.
- Category expense breakdown with progress bars and percentage share.
- Monthly filter control (`YYYY-MM`).
- PDF financial report generator (`PDFViewer` integration).

---

## 4. Non-Functional Requirements

### 4.1 Security & OWASP Standards
- Encryption: Sensitive data encrypted using AES-256 bit encryption.
- Passwords: Salted BCrypt password hashing.
- File Uploads: Extension checks + 1MB file size limits + magic byte header verification.
- Rate Limiting: Configured across backend, BFF, and API Gateway services.
- OWASP Top 10 Mitigation: Protection against SQL injection, XSS, SSRF, and broken access controls.

### 4.2 Accessibility & Compliance
- **W3C WCAG 2.1:** Fully responsive layout, keyboard focus management, ARIA labels, contrast ratios.
- **GIGW (Government of India Guidelines for Websites):** Implemented in Admin Panel with font resizing (A+, A-) and high contrast mode.

---

## 5. External Dependencies
1. **CAPTCHA Service:** `http://localhost:11905`
2. **PostgreSQL Database:** `localhost:5432` (Username: `postgres`, Password: `root`, Database: `cw-expense-tracker`)
3. **Redis Caching Service:** `localhost:6379` (Keys prefixed with `cw-expense-tracker:`)
