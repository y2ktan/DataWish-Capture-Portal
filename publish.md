# Next.js Application Deployment to Hostinger VPS

## 1. Introduction

This guide provides a comprehensive walkthrough for deploying a Next.js application to a Hostinger VPS. These instructions are intended for release managers and assume a Linux-based (Ubuntu) server environment.

## 2. Prerequisites

-   A Hostinger VPS with root or sudo access.
-   A registered domain name pointed to your VPS IP address.
-   A Git repository for your Next.js application.

## 3. Server Setup

### 3.1. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 3.2. Install Node.js

We will use `nvm` (Node Version Manager) to install and manage Node.js versions.

```bash
# Install curl
sudo apt install curl -y

# Download and install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Verify nvm installation
nvm --version

# Install a specific Node.js version (e.g., 20)
nvm install 20
nvm use 20
nvm alias default 20
```

### 3.3. Install Nginx

Nginx will act as a reverse proxy to forward traffic to our Next.js application.

```bash
sudo apt install nginx -y
```

### 3.4. Install PM2

PM2 is a process manager for Node.js applications that will keep our app running in the background.

```bash
npm install pm2 -g
```

## 4. Application Deployment

### 4.1. Clone the Repository

Clone your application's repository to your server.

```bash
git clone <your_repository_url>
cd <your_project_directory>
```

### 4.2. Install Dependencies

```bash
npm install
```

### 4.3. Create a `.env.local` file

Create a `.env.local` file for your production environment variables.

```bash
nano .env.local
```
Add your environment variables, for example:
```
DATABASE_URL=...
NEXT_PUBLIC_API_URL=...
```

### 4.4. Build the Application

```bash
npm run build
```

### 4.5. Start the Application with PM2

```bash
pm2 start npm --name "next-app" -- start
```

To ensure PM2 restarts on server reboot:
```bash
pm2 startup
pm2 save
```

## 5. Nginx Configuration

### 5.1. Create an Nginx Server Block

Create a new Nginx configuration file for your domain.

```bash
sudo nano /etc/nginx/sites-available/<your_domain>
```

Paste the following configuration, replacing `<your_domain>` with your actual domain name:

```nginx
server {
    listen 80;
    server_name <your_domain> www.<your_domain>;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.2. Enable the Server Block

```bash
sudo ln -s /etc/nginx/sites-available/<your_domain> /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 6. SSL/HTTPS Setup with Let's Encrypt

### 6.1. Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 6.2. Obtain an SSL Certificate

```bash
sudo certbot --nginx -d <your_domain> -d www.<your_domain>
```

Certbot will automatically update your Nginx configuration to handle HTTPS.

## 7. Final Verification

Your Next.js application should now be live and accessible via `https://<your_domain>`.

You can monitor your application's logs with:
```bash
pm2 logs next-app
```

To check the status of your application:
```bash
pm2 status
```
