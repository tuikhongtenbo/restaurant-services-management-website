import requests
from langchain.tools import tool
from app.config import settings

@tool
def check_available_slots(target_date: str, party_size: int) -> str:
    """
    Sử dụng công cụ này khi khách hỏi ngày đó còn trống mốc giờ nào không, hoặc muốn xem lịch trống.
    - target_date: Định dạng chuỗi 'YYYY-MM-DD' (Ví dụ: '2026-06-15')
    - party_size: Số lượng khách đi cùng (kiểu số nguyên).
    """
    try:
        # Gọi endpoint GET với query params
        params = {
            "date": target_date,
            "partySize": party_size
        }
        
        # Gọi sang endpoint công khai
        response = requests.get(f"{settings.JAVA_BASE_URL}/api/public/reservations/available-times", params=params)
        
        if response.status_code == 200:
            slots = response.json()
            if not slots or len(slots) == 0:
                return "Kết quả: Đã hết bàn trống. Hãy báo khách xin lỗi và gợi ý chọn ngày khác."
            
            bullet_slots = ", ".join(slots)
            return f"Kết quả: Còn các giờ {bullet_slots}. Hãy báo cho khách và hỏi xem họ muốn đặt lúc mấy giờ."
        return "Lỗi API. Hãy báo khách: 'Xin lỗi, hệ thống tra cứu lịch trống hiện đang bảo trì. Vui lòng gọi hotline 0903 123 456 để được hỗ trợ.'"
    except Exception as e:
        return "Lỗi API. Hãy báo khách: 'Xin lỗi, hệ thống tra cứu lịch trống hiện đang bảo trì. Vui lòng gọi hotline 0903 123 456 để được hỗ trợ.'"