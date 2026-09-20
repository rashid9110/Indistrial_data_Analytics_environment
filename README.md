
# Industrial Data Analytics Environment

A real-time **Predictive Maintenance and Industrial Data Analytics**
system that collects machine sensor data, analyzes machine conditions at
the edge, detects potential faults, stores alerts, and displays live
machine information through a web dashboard.

The project combines **Java-based edge analytics**, **Node.js/Express**,
**MongoDB**, **Socket.IO**, and a **React** dashboard.

## Features

-   Real-time industrial machine monitoring
-   Predictive maintenance / fault detection
-   Edge-side sensor data processing using Java
-   Priority-based task processing
-   Bounded-buffer producer-consumer architecture
-   Critical fault detection using torque and tool-wear thresholds
-   REST API for machine alerts
-   MongoDB storage
-   Real-time updates using Socket.IO
-   React dashboard
-   Normal vs. critical machine statistics
-   Machine status visualization
-   Machine signal history chart
-   Recent alert monitoring
-   Pagination with 20 machines per page
-   Previous / Next navigation
-   Priority indication for critical machines

## System Architecture

``` text
                    Industrial Sensor Dataset
                              |
                              v
                    +----------------------+
                    |   Java Edge Engine   |
                    |----------------------|
                    | Producer-Consumer    |
                    | Priority Queue       |
                    | Priority Scheduling   |
                    | Fault Detection      |
                    +----------+-----------+
                               |
                               | HTTP POST
                               v
                    +----------------------+
                    | Node.js / Express    |
                    | Backend API          |
                    +----------+-----------+
                               |
                  +------------+------------+
                  |                         |
                  v                         v
          +---------------+          +---------------+
          |   MongoDB     |          |  Socket.IO    |
          |   Database    |          | Real-time     |
          +---------------+          | notifications |
                                     +-------+-------+
                                             |
                                             v
                                   +------------------+
                                   | React Dashboard  |
                                   +------------------+
```

## Technology Stack

### Edge Analytics

-   Java
-   Java HTTP Client
-   PriorityQueue
-   Semaphore
-   Producer-Consumer pattern
-   Bounded buffer
-   Batch processing

### Backend

-   Node.js
-   Express.js
-   MongoDB
-   Mongoose
-   Socket.IO
-   CORS

### Frontend

-   React
-   Tailwind CSS
-   Recharts
-   Socket.IO Client
-   Fetch API

## Fault Detection Logic

The edge engine assigns machine priority according to sensor values.

A machine is treated as critical when:

``` text
Torque > 60
OR
Tool Wear > 200
```

Priority assignment:

  Condition                               Priority Status
  ------------------------------------- ---------- --------------------------
  Torque \<= 60 and Tool Wear \<= 200            1 NORMAL
  Torque \> 60 OR Tool Wear \> 200              10 CRITICAL FAULT PREDICTED

This allows potentially dangerous machine conditions to be processed
with higher priority.

## Data Flow

1.  Machine data is read from the industrial dataset.
2.  The Java edge engine creates sensor-processing tasks.
3.  Tasks are placed into a bounded priority queue.
4.  The priority scheduler processes critical tasks with higher
    priority.
5.  The edge engine sends processed machine information to the Node.js
    backend.
6.  Express receives the data through the alerts API.
7.  MongoDB stores the machine alert.
8.  Socket.IO broadcasts the new alert to connected dashboards.
9.  React updates the dashboard in real time.
10. The dashboard displays machine status, sensor values, alerts, and
    charts.

## Backend API

The backend runs on:

``` text
http://localhost:5005
```

### Health Check

``` http
GET /
```

### Get Alerts

``` http
GET /api/alerts
```

Returns the latest stored machine alerts.

### Create Alert

``` http
POST /api/alerts
```

Example request:

``` json
{
  "productID": "L57161",
  "torque": 47,
  "toolWear": 190,
  "rotationalSpeed": 1353,
  "status": "NORMAL"
}
```

Example critical record:

``` json
{
  "productID": "L47783",
  "torque": 71.6,
  "toolWear": 120,
  "rotationalSpeed": 1500,
  "status": "CRITICAL FAULT PREDICTED"
}
```

## Database

The project uses MongoDB.

Default local database:

``` text
mongodb://127.0.0.1:27017/predictive-maintenance
```

The alert document contains:

``` text
productID
torque
toolWear
rotationalSpeed
status
timestamp
```

## Project Structure

A typical project structure is:

``` text
predictive-maintenance-environment/
│
├── backend/
│   ├── models/
│   │   └── Alert.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── Dashboard.jsx
│   │   ├── App.js
│   │   └── ...
│   ├── .env
│   └── package.json
│
├── edge-engine/
│   ├── main.java
│   ├── ai4i2020.csv
│   └── ...
│
├── .gitignore
└── README.md
```

> File names can differ depending on the final project organization.

## Prerequisites

Install the following:

-   Node.js
-   npm
-   Java JDK
-   MongoDB
-   Git

Check installations:

``` bash
node --version
npm --version
java --version
git --version
```

## Backend Setup

Go to the backend directory:

``` bash
cd backend
```

Install dependencies:

``` bash
npm install
```

Start the backend:

``` bash
node server.js
```

The backend should run at:

``` text
http://localhost:5005
```

Expected output:

``` text
MongoDB connected successfully
Predictive maintenance server listening on port 5005
Backend: http://localhost:5005
```

## Frontend Setup

Open another terminal:

``` bash
cd frontend
```

Install dependencies:

``` bash
npm install
```

Install chart and Socket.IO dependencies if required:

``` bash
npm install recharts socket.io-client
```

Create a `.env` file:

``` env
REACT_APP_API_URL=http://localhost:5005
```

Start React:

``` bash
npm start
```

The frontend should be available at:

``` text
http://localhost:3000
```

## Running the Complete System

Run the components in this order.

### 1. Start MongoDB

Make sure MongoDB is running locally, or configure the MongoDB
connection string for your environment.

### 2. Start Backend

``` bash
cd backend
npm install
node server.js
```

### 3. Start Frontend

Open another terminal:

``` bash
cd frontend
npm install
npm start
```

### 4. Start Java Edge Engine

Open another terminal and run the Java edge engine according to the
project source/build configuration.

The edge engine will process the dataset and send machine data to:

``` text
http://localhost:5005/api/alerts
```

## Dashboard

The dashboard provides:

### Machine Statistics

-   Total machines
-   Normal machines
-   Critical machines

### Machine Status Graph

The dashboard visualizes the distribution of:

``` text
NORMAL
CRITICAL
```

### Machine Monitoring

Machine cards display:

-   Product / Machine ID
-   Torque
-   Tool Wear
-   Rotational Speed
-   Priority
-   Current status
-   Timestamp

### Pagination

The dashboard displays:

``` text
20 machines per page
```

Navigation:

``` text
Previous | Page 1 of 5 | Next
```

The number of pages depends on the number of machine records returned by
the backend.

## Real-Time Communication

Socket.IO is used to push newly processed machine alerts from the
backend to the React dashboard.

When a new alert is received:

``` text
Java Edge Engine
       |
       v
POST /api/alerts
       |
       v
Node.js
       |
       +----> MongoDB
       |
       +----> Socket.IO
                |
                v
          React Dashboard
```

This allows the dashboard to update without manually refreshing the
browser.

## Operating System Concepts Used

The edge-processing component demonstrates several Operating System
concepts:

### Producer-Consumer

The producer creates sensor-processing tasks and places them into a
bounded buffer.

The consumer removes tasks from the buffer and processes them.

### Bounded Buffer

The queue has a fixed capacity so that producers cannot continuously add
unlimited tasks.

### Priority Scheduling

Tasks are assigned different priorities.

``` text
Priority 10 -> Critical
Priority 1  -> Normal
```

The priority queue ensures higher-priority tasks are processed before
lower-priority tasks when they are waiting.

### Synchronization

Synchronization mechanisms such as semaphores are used to coordinate
concurrent access to the shared buffer.

### Concurrency

Multiple tasks can be produced and consumed while the system continues
processing incoming machine data.

## Performance Considerations

The system is designed to:

-   Process sensor records at the edge
-   Prioritize critical machine conditions
-   Avoid unbounded memory growth
-   Reduce unnecessary processing delays
-   Store processed alerts centrally
-   Deliver new alerts to the dashboard in real time

## Example Machine Status

Normal:

``` text
Machine: L57161
Torque: 47 Nm
Tool Wear: 190
RPM: 1353
Priority: 1
Status: NORMAL
```

Critical:

``` text
Machine: L47783
Torque: 71.6 Nm
Tool Wear: 120
RPM: 1500
Priority: 10
Status: CRITICAL FAULT PREDICTED
```

The second machine becomes critical because its torque is greater than
60.

## Security and Configuration

Do not commit sensitive credentials to GitHub.

Use environment variables for values such as:

``` env
MONGODB_URI=your_mongodb_connection_string
```

Keep `.env` in `.gitignore`.

Example:

``` gitignore
node_modules/
.env
.env.local
build/
dist/
*.log
```

## Troubleshooting

### Backend cannot connect to MongoDB

Check that MongoDB is running and that the connection string is correct.

### Frontend cannot connect to backend

Check:

``` text
Backend: http://localhost:5005
Frontend: http://localhost:3000
```

Also check the frontend `.env`:

``` env
REACT_APP_API_URL=http://localhost:5005
```

Restart React after changing `.env`.

### CORS error

Make sure the backend allows:

``` text
http://localhost:3000
```

### Socket.IO not updating

Check that:

-   Backend is running.
-   Frontend is connected to port `5005`.
-   Socket.IO client and server are installed.
-   Browser console does not show connection errors.

## Future Improvements

Possible future enhancements include:

-   Machine-level detail pages
-   Advanced predictive ML models
-   Historical maintenance records
-   Failure probability estimation
-   Email/SMS notifications
-   User authentication
-   Role-based access control
-   More industrial sensor types
-   Advanced anomaly detection
-   Maintenance scheduling
-   Cloud deployment
-   Docker containerization
-   Advanced analytics and reports

## Project Purpose

The goal of this project is to demonstrate how **edge analytics,
operating-system scheduling concepts, backend APIs, databases, real-time
communication, and web visualization** can be combined to create an
industrial predictive-maintenance environment.

## Repository

GitHub:

https://github.com/rashid9110/Indistrial_data_Analytics_environment

## License

This project is intended for academic and educational purposes.

