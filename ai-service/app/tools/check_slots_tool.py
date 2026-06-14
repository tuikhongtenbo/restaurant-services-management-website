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
        
        headers = {}
        if settings.STAFF_TOKEN:
            headers["Authorization"] = f"Bearer {settings.STAFF_TOKEN}"
            
        # Gọi sang endpoint nội bộ dành cho staff
        response = requests.get(f"{settings.JAVA_BASE_URL}/api/reservations/available-slots", params=params, headers=headers)
        
        if response.status_code == 200:
            slots = response.json()
            if not slots or len(slots) == 0:
                return "Kết quả: Ngày này hiện tại đã hết sạch bàn trống phù hợp."
            
            # Ép danh sách giờ thành chuỗi gạch đầu dòng
            bullet_slots = "\n".join([f"- {s}" for s in slots])
            return f"Kết quả: Dưới đây là các khung giờ còn trống:\n{bullet_slots}"
        return f"Không thể tra cứu lịch trống. API trả về mã lỗi {response.status_code}."
    except Exception as e:
        return f"Lỗi kết nối khi check slot: {str(e)}"