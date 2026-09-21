# ==============================================================================
# AAPDASETU (AEGIS-MESH) - PRODUCTION MULTI-STAGE DOCKERFILE
# ==============================================================================
FROM python:3.13-slim

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system dependencies & security updates
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Create non-privileged service user for runtime security
RUN useradd -u 1000 -U -s /bin/sh appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# Container healthcheck targeting operational health endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/system/health || exit 1

# Production ASGI Entrypoint
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
