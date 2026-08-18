
# 🎓 AIDSS -  Admission Intelligence & Decision support System

> A centralized, role-based web application that streamlines TNEA admission data management and provides real-time analytics to assist departments in making data-driven admission decisions.

---

## 📌 Overview

The **TNEA Admission Intelligence & Analytics System** is a web-based platform designed to simplify and digitize the management of student admission data collected before and during the Tamil Nadu Engineering Admissions (TNEA) counselling process.

The system enables **Assistant Heads of Departments (AHODs)** to upload and manage student datasets, while providing **Heads of Departments (HODs)** with comprehensive dashboards and analytical reports for effective admission planning and monitoring.

By replacing manual spreadsheet analysis with interactive dashboards and automated insights, the application helps departments identify trends, monitor counselling progress, and improve admission strategies.

---

## 🎯 Objectives

- Digitize the TNEA student admission tracking process.
- Eliminate manual analysis of Excel sheets.
- Provide real-time admission analytics.
- Improve counselling conversion tracking.
- Support department-level admission decision making.
- Maintain historical admission records for future analysis.

---

# ✨ Key Features

## 👤 Role-Based Access Control

### AHOD

- Secure Login
- Upload Excel/CSV student data
- View uploaded records
- Edit/Delete student records
- Validate uploaded data
- Prevent duplicate entries

### HOD

- Dashboard Overview
- Department Analytics
- Admission Statistics
- Student Insights
- Counselling Progress Monitoring
- Export Reports

---

# 📊 Analytics Dashboard

The system provides interactive dashboards including:

### Student Analytics

- Total Applications
- Department-wise Applications
- Community Distribution
- Cutoff Distribution
- Preferred Department Analysis

### Gender Analytics

- Male vs Female Ratio
- Department-wise Gender Distribution

### Location Analytics

- District-wise Students
- City-wise Students
- School-wise Distribution *(Future Scope)*

### Admission Analytics

- Interested Students
- Counselling Registered
- Confirmed Students
- Joined Students
- Admission Conversion Ratio

### Performance Analytics

- Average Cutoff
- Highest Cutoff
- Lowest Cutoff
- Community-wise Admission Trends
- Department Demand Ratio

---

# 📁 Student Data Fields

The uploaded dataset may contain the following information:

| Field                        | Required |
| ---------------------------- | -------- |
| Name                         | ✅       |
| Cutoff                       | ✅       |
| Community                    | ✅       |
| Preferred Department         | ✅       |
| Phone Number                 | Optional |
| Email                        | Optional |
| Gender                       | Optional |
| Address                      | Optional |
| District                     | Optional |
| School Name                  | Optional |
| Top 3 Department Preferences | Optional |
| Counselling Status           | Optional |

---

# 🏗️ System Architecture

```
Student Data Collection
            │
            ▼
      Excel / CSV Upload
            │
            ▼
        AHOD Portal
            │
            ▼
    Data Validation Engine
            │
            ▼
         Database
            │
            ▼
     Analytics Engine
            │
            ▼
      Interactive Dashboard
            │
            ▼
      HOD Decision Support
```

---

# ⚙️ Technology Stack

## Frontend

- React.js
- TypeScript
- Vite
- Material UI (MUI)

### Why?

- Fast development
- Component-based architecture
- Excellent dashboard support
- Responsive UI

---

## Backend

- FastAPI (Python)

### Why?

- High Performance
- Built-in API Documentation
- Easy Excel Processing
- Excellent integration with Pandas

---

## Database

- PostgreSQL

### Why?

- Reliable
- ACID Compliant
- Excellent analytical queries
- Highly scalable

---

## Excel Processing

- Pandas
- OpenPyXL

---

## Charts & Visualization

- Apache ECharts

Provides

- Pie Charts
- Bar Charts
- Heat Maps
- Funnel Charts
- Line Charts
- Interactive Dashboards

---

## Authentication

- JWT Authentication
- Role-Based Authorization

---

## Deployment

Frontend

- Vercel

Backend

- Railway / Render

Database

- PostgreSQL (Neon / Supabase)

---

# 📈 Dashboard Modules

- Overall Dashboard
- Student Analytics
- Department Analytics
- Community Analytics
- Gender Analytics
- District Analytics
- Counselling Analytics
- Admission Conversion Dashboard
- Reports & ExportL

---

# 🔄 Workflow

```
Student Information Collection
            │
            ▼
      AHOD Uploads Excel
            │
            ▼
      Data Validation
            │
            ▼
      Database Storage
            │
            ▼
      Analytics Generation
            │
            ▼
      HOD Dashboard
            │
            ▼
      Admission Decisions
```

---

# 📊 Sample Analytics

The system can generate insights such as:

- Total Applications
- Department Preference Distribution
- Community Distribution
- Gender Ratio
- District-wise Applicants
- Average Cutoff
- Top Performing Districts
- Admission Conversion Rate
- Counselling Confirmation Rate
- Department Demand Ratio

---

# 🔒 Security Features

- JWT Authentication
- Password Hashing
- Role-Based Access Control
- Secure File Upload Validation
- Duplicate Record Detection
- Audit Logging *(Future)*

---

# 🚀 Future Enhancements

- AI-based Admission Prediction
- Student Priority Scoring
- Admission Probability Estimation
- WhatsApp/Email Notifications
- SMS Alerts
- Historical Trend Analysis
- Mobile Dashboard
- Multi-Department Support
- Multi-College Deployment
- OCR-based Admission Form Reading
- Power BI Integration
- Predictive Analytics using Machine Learning

---

# 📂 Project Structure

```
tnea-admission-analytics/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── assets/
│
├── backend/
│   ├── app/
│   ├── api/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
│
├── database/
│
├── uploads/
│
├── docs/
│
├── README.md
│
└── requirements.txt
```

---

# 💡 Advantages

- Eliminates manual Excel processing
- Centralized admission management
- Faster departmental decision making
- Real-time analytics
- Interactive dashboards
- Historical data maintenance
- Better admission planning
- Improved counselling tracking

---

# 🎯 Target Users

- Assistant Head of Department (AHOD)
- Head of Department (HOD)
- Admission Coordinators
- College Administration
- Principal / Dean *(Future)*

---

# 📚 Use Cases

- TNEA Admission Management
- Student Lead Tracking
- Department Admission Planning
- Counselling Monitoring
- Admission Analytics
- Historical Admission Analysis

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push your branch
5. Open a Pull Request

---

# 📄 License

This project is developed for educational and institutional purposes.

---

# 👨‍💻 Developed By

**Department Internal Admission Tracking Team**

Designed to modernize TNEA counselling data management through intelligent analytics and role-based access control.

---

⭐ If you find this project useful, don't forget to give it a **Star** on GitHub!
