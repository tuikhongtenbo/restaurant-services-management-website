import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # 1. Các biến cấu hình hệ thống (Có giá trị mặc định nếu file .env thiếu)
    JAVA_BASE_URL: str = "http://localhost:8080"
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    STAFF_TOKEN: str = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmZTUwNjY3NS0yYzVhLTQ3NzEtOWQyNS0wMWY4YzA4MjFjYmYiLCJlbWFpbCI6ImhvY251YWRpYm8wMTAxQGdtYWlsLmNvbSIsInVzZXJUeXBlIjoiRU1QTE9ZRUUiLCJpYXQiOjE3ODA5MDk5NDAsImV4cCI6MTc4MDk5NjM0MH0.U6WLKps7CKk1HD0KWCNQLw18LYScFG_75xFjOCWLbG4" # Token staff để AI gọi API bảo mật
    
    # Bạn có thể thêm các biến cấu hình khác tại đây nếu cần mở rộng sau này
    # Ví dụ: 
    # ENVIRONMENT: str = "development"
    # APP_PORT: int = 8000

    # 2. Cấu hình đọc file .env nằm ở thư mục gốc của dự án ai-service
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore" # Bỏ qua các biến thừa trong file .env nếu không khai báo ở trên
    )

# Khởi tạo một instance duy nhất để các file khác import vào dùng luôn (Singleton Pattern)
settings = Settings()