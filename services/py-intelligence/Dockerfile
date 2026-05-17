FROM python:3.11-slim

# Prevent Python from writing pyc files and keep stdout unbuffered
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV HF_HUB_DISABLE_PROGRESS_BARS=1


WORKDIR /app

# Install dependencies first (leverages Docker cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the SentenceTransformer model
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('nomic-ai/nomic-embed-text-v1.5', trust_remote_code=True)"

# Pre-download the local text-generation model
RUN python -c "from transformers import pipeline; pipeline('text-generation', model='Qwen/Qwen2.5-Coder-3B')"


# Copy the rest of the application code

COPY . .

EXPOSE 8000

# Start the application.
CMD ["uvicorn", "app.apis:app", "--host", "0.0.0.0", "--port", "8000"]
