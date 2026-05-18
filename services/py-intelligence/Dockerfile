FROM python:3.11-slim

# Disable Python byte code and specify cache location
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV HF_HUB_DISABLE_PROGRESS_BARS=1
ENV HF_HOME=/app/hf_cache

WORKDIR /app

# 1. Install pytorch without CUDA deps
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install other dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2. Pre-download models
RUN python -c "from huggingface_hub import snapshot_download; \
snapshot_download(repo_id='nomic-ai/nomic-embed-text-v1.5')"

# 3. Light QWEN
RUN python -c "from huggingface_hub import hf_hub_download; \
hf_hub_download(repo_id='Qwen/Qwen2.5-Coder-3B-Instruct-GGUF', filename='qwen2.5-coder-3b-instruct-q4_k_m.gguf', local_dir='/app/models')"

# Copy the rest of the application code
COPY . .

EXPOSE 8000

# Start the application
CMD ["uvicorn", "app.apis:app", "--host", "0.0.0.0", "--port", "8000"]
