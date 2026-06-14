import requests
from langchain.tools import tool
from app.config import settings

@tool
def create_restaurant_booking(customer_name: str, customer_phone: str, party_size: int, reserved_at: str, note: str = "") -> str:
    """
    Sử dụng công cụ này ĐỂ THỰC HIỆN ĐẶT BÀN khi khách đã cung cấp đủ cả 4 thông tin: 
    Tên, SĐT, Số người, và Ngày giờ chuẩn ISO (YYYY-MM-DDTHH:MM:SS).
    """
    if customer_name.lower() in ["", "khách", "khách hàng", "khach", "user", "người dùng"] or customer_phone in ["", "0123456789", "123456789", "0123", "0000"]:
        return "LỖI: Bạn đang tự bịa Tên hoặc SĐT. Hãy dừng việc gọi tool và lịch sự yêu cầu khách hàng cung cấp Tên và Số điện thoại thật."
        
    payload = {
        "customerName": customer_name,
        "customerPhone": customer_phone,
        "partySize": party_size,
        "reservedAt": reserved_at,
        "note": note
    }
    try:
        response = requests.post(f"{settings.JAVA_BASE_URL}/api/public/reservations", json=payload)
        if response.status_code == 200 or response.status_code == 201:
            return "Thành công! Hãy báo khách: 'Đặt bàn thành công! Nhân viên nhà hàng sẽ gọi điện xác nhận với quý khách trong thời gian sớm nhất.'"
        return "Lỗi. Hãy báo khách: 'Xin lỗi, hệ thống đặt bàn hiện đang gặp sự cố. Vui lòng gọi hotline 0903 123 456 để được hỗ trợ.'"
    except Exception as e:
        return "Lỗi. Hãy báo khách: 'Xin lỗi, hệ thống đặt bàn hiện đang gặp sự cố. Vui lòng gọi hotline 0903 123 456 để được hỗ trợ.'"