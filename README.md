# Before or After

A daily, addictively engaging casual game where players guess the release year
of albums, artworks, images, movies, and more in short, self-paced rounds.

## Table of Contents

- [Overview](#overview)
  - [Purpose](#purpose)
  - [Team](#team)
- [Getting Started and Contributing](#getting-started-and-contributing)

## Overview

### Purpose

Before or After is a casual web-based game designed for anyone with a few spare
moments seeking quick, self-paced entertainment. Each day, players challenge
themselves to guess the release year of various cultural artifacts—albums,
artworks, images, movies, and more—using a simple before-or-after mechanic. This
trivia format keeps the experience fresh and educational, blending addictive
gameplay with knowledge gain.

## Team

The Merge Masters consists of 5 Cal Poly students. Over the course of about 5
weeks, we worked as a team to deploy this web application.

- [Kevin Rutledge](https://www.linkedin.com/in/rutledge-kevin/) - Software
  Developer

- [Sean Griffin](https://www.linkedin.com/in/sean-griffin-9855b126b/) - Software
  Developer

- [Yenny Ma](https://www.linkedin.com/in/yenny-ma/) - Software Developer

- [Venkata Ande](https://www.linkedin.com/in/venkata-g-ande-1b2057334/) -
  Software Developer

- [Thomas Hagos](https://www.linkedin.com/in/thomashagos/) - Software Developer

## Getting Started and Contributing

- Visit [getting-started.md](docs/getting-started.md) for setup instructions.
- Visit [CONTRIBUTING.md](docs/CONTRIBUTING.md) for contribution guidelines.

## Architecture Flows

### Sign-up

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend (React)
    participant B as Backend (Express)
    participant DB as MongoDB
    
    U->>F: Fill signup form (email, password)
    F->>F: Validate password length >= 6 chars
    U->>F: Click "Sign Up"
    
    F->>B: POST /api/auth/signup
    Note over F,B: {email: "user@example.com", password: "plaintext"}
    
    B->>B: Validate input (email, password required)
    B->>B: Validate password length >= 6 chars
    
    B->>DB: Check if email exists
    DB-->>B: User lookup result
    
    alt Email already exists
        B-->>F: 400 {message: "Email already exists"}
        F-->>U: Show error message
    else Email available
        B->>B: Generate salt (10 rounds)
        B->>B: Hash password with bcrypt
        
        B->>DB: Insert user record
        Note over B,DB: {email, hashedPassword, role: "user", createdAt}
        DB-->>B: User created successfully
        
        B-->>F: 201 {success: true, message: "User registered successfully"}
        
        F->>F: Navigate to /login
        F-->>U: Show "Account created! Please sign in." message
    end
```

### Sign-in

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend (React)
    participant B as Backend (Express)
    participant DB as MongoDB
    
    U->>F: Fill login form (email, password)
    U->>F: Click "Sign In"
    
    F->>B: POST /api/auth/login
    Note over F,B: {email: "user@example.com", password: "plaintext"}
    
    B->>B: Validate input (email, password required)
    
    B->>DB: Find user by email
    DB-->>B: User record or null
    
    alt User not found
        B-->>F: 401 {message: "Invalid credentials"}
        F-->>U: Show error message
    else User found
        B->>B: Compare password with bcrypt
        Note over B: bcrypt.compare(password, hashedPassword)
        
        alt Password mismatch
            B-->>F: 401 {message: "Invalid credentials"}
            F-->>U: Show error message
        else Password valid
            B->>B: Generate JWT token (24h expiry)
            Note over B: jwt.sign({email, role, id}, JWT_SECRET)
            
            B-->>F: 200 {token, user: {email, role}}
            
            F->>F: Store token in localStorage
            F->>F: Update AuthContext state
            F->>F: Navigate to / (home page)
            F-->>U: Show authenticated interface
        end
    end
```