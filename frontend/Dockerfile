# ============================================================
# STAGE 1: Build React / Vite frontend
# ============================================================
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Copy dependency files first for Docker caching
COPY frontend/package.json frontend/package-lock.json ./

# Install exact dependencies from package-lock.json
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build the newest production Vite files
RUN npm run build


# ============================================================
# STAGE 2: Laravel + PHP + Nginx
# ============================================================
FROM php:8.3-fpm-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    git \
    curl \
    unzip \
    libzip-dev \
    libpq-dev \
    libicu-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libonig-dev \
    libxml2-dev \
    && rm -rf /var/lib/apt/lists/*

# Configure GD
RUN docker-php-ext-configure gd \
    --with-freetype \
    --with-jpeg

# Install PHP extensions needed by Laravel
RUN docker-php-ext-install -j$(nproc) \
    pdo_mysql \
    pdo_pgsql \
    mbstring \
    bcmath \
    intl \
    zip \
    gd \
    exif \
    pcntl

# Copy Composer from official Composer image
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer


# ============================================================
# Laravel backend
# ============================================================
WORKDIR /var/www/backend

COPY backend/composer.json backend/composer.lock ./

RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts

COPY backend/ /var/www/backend/

# Run optimized Composer autoload after project files exist
RUN composer dump-autoload \
    --optimize \
    --no-dev


# ============================================================
# Frontend production files
# ============================================================

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# IMPORTANT:
# Copy the NEW Vite build from Stage 1.
#
# This means HostForge will NOT use an old frontend/dist folder
# from GitHub. It builds a fresh one every deployment.
COPY --from=frontend-build /app/frontend/dist/ /usr/share/nginx/html/


# ============================================================
# Laravel storage / cache permissions
# ============================================================
RUN mkdir -p \
    /var/www/backend/storage/framework/cache \
    /var/www/backend/storage/framework/sessions \
    /var/www/backend/storage/framework/views \
    /var/www/backend/storage/logs \
    /var/www/backend/bootstrap/cache

RUN chown -R www-data:www-data \
    /var/www/backend/storage \
    /var/www/backend/bootstrap/cache

RUN chmod -R 775 \
    /var/www/backend/storage \
    /var/www/backend/bootstrap/cache


# ============================================================
# Nginx configuration
# ============================================================
COPY nginx.conf /etc/nginx/nginx.conf


# ============================================================
# Supervisor
# ============================================================
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf


# HostForge expects application traffic here
EXPOSE 8080


# Start PHP-FPM + Nginx
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]