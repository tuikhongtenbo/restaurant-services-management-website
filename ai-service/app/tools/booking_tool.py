import requests
from langchain.tools import tool
from app.config import settings

@tool
def create_restaurant_booking(customer_name: str, customer_phone: str, party_size: int, reserved_at: str, note: str = "") -> str:
    """
    Sử dụng công cụ này ĐỂ THỰC HIỆN ĐẶT BÀN khi khách đã cung cấp đủ cả 4 thông tin: 
    Tên, SĐT, Số người, và Ngày giờ chuẩn ISO (YYYY-MM-DDTHH:MM:SS).
    """
    payload = {
        "customerName": customer_name,
        "customerPhone": customer_phone,
        "partySize": party_size,
        "reservedAt": reserved_at,
        "note": note
    }
    try:
        # Đường dẫn trỏ tới API lưu đặt bàn PENDING của bạn
        response = requests.post(f"{settings.JAVA_BASE_URL}/api/public/reservations", json=payload)
        if response.status_code == 200 or response.status_code == 201:
            return "Thành công! Đã tạo đơn đặt bàn. Hãy phản hồi khách rằng: Nhân viên sẽ gọi xác nhận với khách hàng trong khoảng thời gian sớm nhất."
        return f"Java Backend báo lỗi: {response.text}"
    except Exception as e:
        return f"Lỗi kết nối Backend: {str(e)}"