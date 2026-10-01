---

# 🗳️ DevOps Voting App

![Docker](https://img.shields.io/badge/Docker-Containerized-blue?logo=docker)
![Python](https://img.shields.io/badge/Python-Flask-yellow?logo=python)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![Redis](https://img.shields.io/badge/Redis-Queue-red?logo=redis)
![MySQL](https://img.shields.io/badge/MySQL-Database-blue?logo=mysql)
![License](https://img.shields.io/badge/License-MIT-green)

> 🚀 A **multi-container microservices voting application** built using Docker & Docker Compose
> 💡 *Learning DevOps with real-world architecture*

---

## 📸 Project Preview

```
Vote Page   → http://localhost:8080
Result Page → http://localhost:8081
```

---

## 📋 Overview

This project demonstrates a **real-world DevOps architecture** using microservices.

Users vote between:

* ✅ Enjoying
* ❌ Not Enjoying

Behind the scenes:

* Flask app sends vote → Redis queue
* Worker processes → MySQL DB
* Node.js app displays results

---

## 🏗️ Architecture Diagram

```
        ┌──────────────┐
        │   Browser    │
        └──────┬───────┘
               ▼
     ┌──────────────────┐
     │ Vote (Flask)     │
     │ :8080            │
     └──────┬───────────┘
            ▼
     ┌──────────────────┐
     │ Redis Queue      │
     │ :6379            │
     └──────┬───────────┘
            ▼
     ┌──────────────────┐
     │ Worker (Python)  │
     └──────┬───────────┘
            ▼
     ┌──────────────────┐
     │ MySQL Database   │
     │ :3306            │
     └──────┬───────────┘
            ▼
     ┌──────────────────┐
     │ Result (Node.js) │
     │ :8081            │
     └──────┬───────────┘
            ▼
        ┌──────────────┐
        │   Browser    │
        └──────────────┘
```

---

## ⚙️ Tech Stack

| Layer         | Technology        |
| ------------- | ----------------- |
| Frontend      | Flask (Python)    |
| Backend       | Node.js (Express) |
| Queue         | Redis             |
| Database      | MySQL             |
| Orchestration | Docker Compose    |

---

## 🔄 Data Flow

1. User votes on **Flask app**
2. Vote pushed to **Redis queue**
3. Worker reads queue (BLPOP)
4. Worker updates **MySQL**
5. Node.js app fetches results every 2 sec
6. Live results displayed

---

## 🚀 Quick Start

### 🔧 Prerequisites

* Docker
* Docker Compose
* Git

---

### 📥 Clone Repo

```bash
git clone https://github.com/your-username/devops-voting-app.git
cd devops-voting-app
```

---

### ▶️ Run App

```bash
docker compose up --build
```

Run in background:

```bash
docker compose up -d
```

---

### 🌐 Access

* Voting App → [http://localhost:8080](http://localhost:8080)
* Result App → [http://localhost:8081](http://localhost:8081)

---

### 🛑 Stop

```bash
docker compose down
```

Remove volumes:

```bash
docker compose down -v
```

---

## 📁 Folder Structure

```
devops-voting-app/
│
├── vote/              # Flask frontend
├── worker/            # Background processor
├── result/            # Node.js app
├── docker-compose.yml
└── README.md
```

---

## 🐳 Docker Highlights

* Multi-container architecture
* Service isolation
* Internal networking
* Volume-based persistence
* Health checks & dependencies

---

## 🛠️ Troubleshooting

### ❌ Port Already in Use

```yaml
ports:
  - "9090:5000"
```

---

### 🔁 Restart Services

```bash
docker compose restart worker
docker compose restart result
```

---

### 📜 Logs

```bash
docker compose logs -f vote
docker compose logs -f worker
docker compose logs -f mysql
```

---

## 🌟 Features

✔ Microservices architecture
✔ Real-time updates
✔ Scalable queue system
✔ Dockerized setup
✔ Easy to deploy

---

## 🚀 Future Improvements

* Kubernetes deployment
* CI/CD pipeline (GitHub Actions)
* Authentication system
* UI enhancement

---

## 🤝 Contributing

Pull requests are welcome!
For major changes, please open an issue first.

---

## 📄 License

MIT License

---

## ❤️ Satyam

**Built with passion while learning DevOps** 🚀

---
