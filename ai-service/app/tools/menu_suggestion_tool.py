import requests
import random
from langchain.tools import tool
from app.config import settings

@tool
def get_restaurant_menu_for_suggestion() -> str:
    """
    Sử dụng công cụ này để lấy toàn bộ danh sách món ăn kèm giá tiền hiện tại của nhà hàng khi khách muốn xem menu hoặc thực đơn.
    """
    try:
        response = requests.get(f"{settings.JAVA_BASE_URL}/api/public/menu")
        if response.status_code == 200:
            json_data = response.json()
            văn_bản_menu = "DANH SÁCH THỰC ĐƠN ĐANG PHỤC VỤ:\n"
            if "data" in json_data:
                for category_group in json_data["data"]:
                    for item in category_group.get("items", []):
                        văn_bản_menu += f"- Món: {item.get('name')} | Giá: {item.get('price')}đ | Danh mục: {item.get('category')}\n"
            return văn_bản_menu
        return "Không lấy được danh sách thực đơn từ Server."
    except Exception as e:
        return f"Lỗi kết nối dữ liệu món ăn: {str(e)}"

@tool
def suggest_set_menu(budget: int) -> str:
    """
    Sử dụng công cụ này khi khách hàng yêu cầu gợi ý set món ăn theo một ngân sách nhất định (ví dụ: 200k, 500k).
    Tham số budget là số tiền (ví dụ: 200000).
    """
    try:
        response = requests.get(f"{settings.JAVA_BASE_URL}/api/public/menu")
        if response.status_code != 200:
            return "Không lấy được danh sách thực đơn từ Server."
            
        json_data = response.json()
        all_items = []
        if "data" in json_data:
            for category_group in json_data["data"]:
                for item in category_group.get("items", []):
                    if item.get("price") is not None:
                        all_items.append(item)
                        
        if not all_items:
            return "Hiện tại nhà hàng chưa có món ăn nào để gợi ý."

        random.shuffle(all_items)
        selected_items = []
        current_sum = 0
        
        for item in all_items:
            price = int(item.get("price"))
            if current_sum + price <= budget:
                selected_items.append(item)
                current_sum += price
                
        if not selected_items:
            min_price = min([int(item.get("price")) for item in all_items])
            return f"Ngân sách {budget}đ khá thấp, món rẻ nhất của chúng tôi hiện là {min_price}đ. Quý khách có muốn tăng ngân sách lên không ạ?"

        result_str = f"Dựa trên ngân sách {budget}đ, nhà hàng xin gợi ý set món sau:\n\n"
        for idx, item in enumerate(selected_items):
            result_str += f"{idx + 1}. {item.get('name')} - {item.get('price')}đ\n"
        result_str += f"\nTổng cộng: {current_sum}đ\n\n"
        result_str += "Quý khách thấy set này thế nào ạ?"
        return result_str
    except Exception as e:
        return f"Lỗi tính toán set món: {str(e)}"