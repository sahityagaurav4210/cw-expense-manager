# Software Design Document (SDD)
## CW Expense Tracker Application

**Document Version:** 1.0.0  
**Author:** Gaurav Sahitya  
**Date:** October 2026  
**Status:** Approved & Implemented  

---

## 1. Executive Summary & Architecture Overview

The **CW Expense Tracker Application** is designed as a distributed, decoupled multi-service system. The platform employs a microservice design pattern comprising two frontend applications, a Backend for Frontend (BFF), an API Gateway, an Express/TypeScript backend microservice, Redis caching, PostgreSQL database, and external CAPTCHA validation.

```
[ User Frontend (Client: :3000) ]      [ Admin Panel (GIGW: :3001) ]
                  \                             /
                   \                           /
                    v                         v
               [ Backend for Frontend (BFF: :4000) ]
                                  |
                                  v
                [ API Gateway (Spring Boot: :8080) ]
                                  |
                                  v
               [ Backend Express TS Service (:5000) ]
                    /             |             \
                   v              v              v
        [ PostgreSQL :5432 ] [ Redis :6379 ] [ CAPTCHA Service :11905 ]
```

---

## 2. Component Design & Responsibilities

### 2.1 Predefined UI Components (`components/core/`)
1. **`OptionCard` (`OptionCard.jsx`):** Custom checkbox container card for option selection.
2. **`FileUploader` (`FileUploader.jsx`):** Secure avatar upload component enforcing magic-byte header validation (`JPEG`/`PNG`), 1MB size limit, and instant preview.
3. **`Footer` (`Footer.jsx`):** Application footer displaying copyright attribution (`© 2026 Gaurav Sahitya`), country badge, Terms & Conditions, and Privacy Policy links.
4. **`ConfirmationDialog` (`ConfirmationDialog.jsx`):** Reusable MUI confirmation modal for destructive and create/update/delete operations.
5. **`AppTheme` (`AppTheme.js`):** Custom theme setup with `Inter` typography, `#000080` Navy primary palette, custom table cell padding, and animated button interactions.
6. **`PDFViewer` (`PDFViewer.jsx`):** PDF document renderer for exporting financial reports.
7. **`CaptchaComponent` (`CaptchaComponent.jsx`):** CAPTCHA challenge component fetching image/audio streams from local CAPTCHA service (`http://localhost:11905`).

---

## 3. Database Schemas & Entity Relationships

The PostgreSQL database enforces separation of concerns using PostgreSQL schemas:

### 3.1 Master Schema (`master`)

#### Table: `master.categories`
| Column Name   | Data Type     | Constraints                              |
|---------------|---------------|------------------------------------------|
| `id`          | INTEGER       | PRIMARY KEY, AUTO_INCREMENT              |
| `name`        | VARCHAR(100)  | NOT NULL                                 |
| `active_flag` | BOOLEAN       | NOT NULL, DEFAULT true                   |
| `delete_flag` | BOOLEAN       | NOT NULL, DEFAULT false                  |
| `created_at`  | TIMESTAMP     | NOT NULL                                 |
| `updated_at`  | TIMESTAMP     | NOT NULL                                 |

### 3.2 Public Schema (`public`)

#### Table: `public.users`
| Column Name         | Data Type     | Constraints                       |
|---------------------|---------------|-----------------------------------|
| `id`                | INTEGER       | PRIMARY KEY, AUTO_INCREMENT       |
| `name`              | VARCHAR(32)   | NOT NULL                          |
| `email`             | VARCHAR(32)   | NOT NULL, UNIQUE                  |
| `phone_no`          | VARCHAR(10)   | NULLABLE                          |
| `password`          | VARCHAR(255)  | NOT NULL (BCrypt Hash)            |
| `employment_type`   | ENUM          | 'Salaried', 'Self-Employed'       |
| `profile_photo_url` | VARCHAR(500)  | NULLABLE                          |

#### Table: `public.budgets`
| Column Name | Data Type    | Constraints                             |
|-------------|--------------|-----------------------------------------|
| `id`        | INTEGER      | PRIMARY KEY, AUTO_INCREMENT             |
| `user_id`   | INTEGER      | FOREIGN KEY (`public.users.id`)         |
| `amount`    | DECIMAL(12,2)| NOT NULL                                |
| `from_date` | DATE         | NOT NULL                                |
| `to_date`   | DATE         | NOT NULL                                |

#### Table: `public.expenses`
| Column Name   | Data Type    | Constraints                             |
|---------------|--------------|-----------------------------------------|
| `id`          | INTEGER      | PRIMARY KEY, AUTO_INCREMENT             |
| `user_id`     | INTEGER      | FOREIGN KEY (`public.users.id`)         |
| `category_id` | INTEGER      | FOREIGN KEY (`master.categories.id`)    |
| `name`        | VARCHAR(64)  | NOT NULL                                |
| `amount`      | DECIMAL(12,2)| NOT NULL                                |
| `type`        | ENUM         | 'Fixed', 'Variable'                     |
| `expense_date`| DATE         | NULLABLE                                |

---

## 4. Redis Caching Strategy
- All Redis keys are prefixed with string `cw-expense-tracker:`.
- Master categories cached under `cw-expense-tracker:categories:master` with 1-hour expiration time.
- Cache invalidated automatically on category creation, toggle, or soft deletion.

---

## 5. Security & VAPT Audit Compliance
- **Authentication:** JWT tokens stored in HTTP-Only secure cookies.
- **Encryption:** AES-256 CBC encryption for sensitive data payloads.
- **Passwords:** BCrypt password hashing with salt factor 10.
- **Input Sanitization:** Joi validation schemas on backend and Zod schemas on frontend.
- **Upload Security:** File magic byte validation prevents extension spoofing.
