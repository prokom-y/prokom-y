FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ src/

CMD ["sh", "-c", "python src/manage.py migrate && python src/manage.py runserver 0.0.0.0:3000"]
