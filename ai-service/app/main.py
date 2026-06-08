import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
# Gọi trực tiếp thực thể agent_service đã được cấu hình sẵn từ tầng Service độc lập
from app.services.agent_service import agent_service

# Khởi tạo ứng dụng FastAPI
app = FastAPI(
    title="Artiste Restaurant AI Agent Service",
    description="File chạy gốc điều hướng API sang hệ thống Agent độc lập",
    version="1.0.0"
)

# Cấu hình CORS mở cổng kết nối cho React Frontend của User
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Định nghĩa cấu trúc dữ liệu nhận vào từ khung Chat Frontend
class ChatInput(BaseModel):
    message: str

# Endpoint tiếp nhận tin nhắn chat
@app.post("/api/chat")
async def handle_chatbot_conversation(payload: ChatInput):
    try:
        # Bắn trực tiếp câu nói của khách sang cho hàm execute_chat bên trong agent_service.py
        bot_answer = agent_service.execute_chat(payload.message)
        return {"answer": bot_answer}
    except Exception as e:
        # Trả về lỗi hệ thống nếu tầng Agent gặp sự cố tính toán hoặc mất kết nối Ollama/Java
        raise HTTPException(status_code=500, detail=f"Internal Agent Error: {str(e)}")

# Khởi chạy uvicorn server tại port 8000 khi gõ lệnh chạy file trực tiếp
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)