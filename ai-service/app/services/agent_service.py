import json
from datetime import datetime, timedelta
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage, AIMessage
from app.tools.booking_tool import create_restaurant_booking
from app.tools.check_slots_tool import check_available_slots
from app.tools.menu_suggestion_tool import get_restaurant_menu_for_suggestion, suggest_set_menu

def generate_date_mapping():
    today = datetime.now()
    days_map = {0: "Thứ 2", 1: "Thứ 3", 2: "Thứ 4", 3: "Thứ 5", 4: "Thứ 6", 5: "Thứ 7", 6: "Chủ nhật"}
    mapping_str = f"- Hôm nay: {today.strftime('%Y-%m-%d')}\n"
    mapping_str += f"- Ngày mai: {(today + timedelta(days=1)).strftime('%Y-%m-%d')}\n"
    mapping_str += f"- Ngày mốt: {(today + timedelta(days=2)).strftime('%Y-%m-%d')}\n"
    current_weekday = today.weekday()
    mapping_str += "- Tuần này:\n"
    for i in range(7):
        target_date = today + timedelta(days=(i - current_weekday))
        if target_date >= today:
            mapping_str += f"  + {days_map[i]} tuần này: {target_date.strftime('%Y-%m-%d')}\n"
    mapping_str += "- Tuần sau:\n"
    for i in range(7):
        target_date = today + timedelta(days=(i - current_weekday + 7))
        mapping_str += f"  + {days_map[i]} tuần sau: {target_date.strftime('%Y-%m-%d')}\n"
    return mapping_str

class AgentService:
    def __init__(self):
        # 1. Bản đồ ánh xạ để thực thi Function Call
        self.tools_map = {
            "create_restaurant_booking": create_restaurant_booking,
            "check_available_slots": check_available_slots,
            "get_restaurant_menu_for_suggestion": get_restaurant_menu_for_suggestion,
            "suggest_set_menu": suggest_set_menu
        }
        
        # 2. Khai báo danh sách công cụ cho mô hình nhận diện
        self.tools = [create_restaurant_booking, check_available_slots, get_restaurant_menu_for_suggestion, suggest_set_menu]
        
        # 3. Khởi tạo Llama 3 và ép cấu hình liên kết chặt chẽ với các công cụ
        self.llm = ChatOllama(
            model="llama3.1",
            temperature=0,  # Giữ bằng 0 để tính toán ngân sách và ngày giờ chính xác
            base_url="http://localhost:11434"
        ).bind_tools(self.tools)
        
        self.system_instruction = (
            "Bạn là trợ lý ảo chuyên nghiệp của nhà hàng Artiste. Hãy hỗ trợ khách hàng lịch sự, rõ ràng và hiệu quả.\n\n"
            "<system_info>\n"
            "THÔNG TIN NGÀY GIỜ HIỆN TẠI (DÙNG ĐỂ GỌI TOOL, TUYỆT ĐỐI KHÔNG HIỂN THỊ CHO KHÁCH):\n"
            f"{generate_date_mapping()}\n"
            "</system_info>\n\n"
            "1. TRA CỨU LỊCH TRỐNG ('check_available_slots'):\n"
            "- Tự động tra bảng trên để chuyển đổi 'tối mai', 'thứ 5 tuần sau' thành 'YYYY-MM-DD'.\n\n"
            "2. GỢI Ý SET MÓN ('suggest_set_menu'):\n"
            "- Khi khách nhờ gợi ý set ăn, gọi công cụ này. CHÚ Ý: '1000k' tức là budget 1000000; '500k' là 500000.\n\n"
            "3. ĐẶT BÀN ('create_restaurant_booking'):\n"
            "- BẮT BUỘC có đủ: Tên, SĐT, Số người, Ngày giờ.\n"
            "- Nếu thiếu Tên/SĐT, TUYỆT ĐỐI KHÔNG gọi tool. Hỏi lại khách.\n"
            "- Chuyển giờ: '15h' = 15:00:00; '7h tối' = 19:00:00.\n"
            "- Nối ngày và giờ thành ISO 8601 CÓ MÚI GIỜ (VD: 2026-06-18T15:00:00+07:00).\n\n"
            "4. XEM MENU / THỰC ĐƠN:\n"
            "- KHI KHÁCH YÊU CẦU XEM MENU HOẶC THỰC ĐƠN: BẮT BUỘC gọi tool 'get_restaurant_menu_for_suggestion'.\n\n"
            "5. CHÀO HỎI:\n"
            "- Nếu khách chào, trả lời chính xác: \"Tôi là trợ lý ảo của nhà hàng, rất hân hạnh được hỗ trợ quý khách.\"\n\n"
            "6. NGOÀI PHẠM VI & XÃ GIAO:\n"
            "- Bắt buộc: \"Xin lỗi, phần này ngoài phạm vi của tôi. Xin quý khách hãy hỏi các vấn đề liên quan đến nhà hàng\" nếu khách hỏi ngoài lề.\n"
            "- KHÔNG ĐƯỢC gọi tool tra cứu lịch trống hay bất kỳ tool nào nếu khách chỉ chat các từ vô nghĩa (như 'alo', 'allo', 'test', 'ê'). Hãy trả lời: 'Xin chào, tôi là trợ lý ảo của nhà hàng. Tôi có thể giúp gì cho quý khách?'\n\n"
            "QUY TẮC QUAN TRỌNG NHẤT:\n"
            "- Không bao giờ hiển thị phần <system_info> cho khách.\n"
            "- Tuyệt đối KHÔNG trả về JSON cho khách."
        )

    def execute_chat(self, user_message: str) -> str:
        # Xử lý nhanh các câu chào hỏi cơ bản để tránh LLM sinh lỗi chính tả hoặc ảo giác gọi tool
        msg_lower = user_message.strip().lower()
        if msg_lower in ["xin chào", "chào", "hello", "hi", "chào bạn", "xin chào nè", "chào quán", "chào shop", "chào ad", "alo", "allo", "ê", "test"]:
            return "Xin chào, tôi là trợ lý ảo của nhà hàng Artiste. Tôi có thể giúp gì cho quý khách (ví dụ: đặt bàn, xem menu, gợi ý món ăn)?"
            
        # Bắt buộc đặt SystemMessage ở đầu mảng để làm kim chỉ nam cho toàn bộ cuộc hội thoại
        messages = [
            SystemMessage(content=self.system_instruction),
            HumanMessage(content=user_message)
        ]
        
        # Lượt 1: Gửi câu hỏi của khách + System Instruction cho Llama 3 suy nghĩ
        ai_msg = self.llm.invoke(messages)
        messages.append(ai_msg)
        
        # Nếu Llama 3 quyết định cần phải dùng đến công cụ (Function Calling)
        if ai_msg.tool_calls:
            bypass_2nd_turn = False
            last_tool_output = ""
            
            for tool_call in ai_msg.tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]
                
                if tool_name in self.tools_map:
                    # Kích hoạt chạy Tool tương ứng (gọi sang Java API công khai)
                    chosen_tool = self.tools_map[tool_name]
                    tool_output = chosen_tool.invoke(tool_args)
                    last_tool_output = str(tool_output)
                    
                    if tool_name in ["get_restaurant_menu_for_suggestion", "suggest_set_menu"]:
                        bypass_2nd_turn = True
                        
                    messages.append(ToolMessage(
                        content=last_tool_output, 
                        tool_call_id=tool_call["id"]
                    ))
                    
            if bypass_2nd_turn:
                # Bỏ qua LLM sinh chữ lần 2, trả về trực tiếp kết quả đã format sẵn của Tool (cho xem menu/set món)
                return last_tool_output
                
            # Lượt 2: Cho Llama 3 nhìn lại kết quả của các Tool giao tiếp (Booking, Check Slots) để phản hồi
            final_ai_msg = self.llm.invoke(messages)
            response_text = final_ai_msg.content
            
            if response_text.startswith("assistant\n\n"):
                response_text = response_text[11:]
                
            return response_text
            
        # Nếu khách chỉ chat xã giao (ví dụ: "Chào em"), trả về câu trả lời bình thường của Bot
        content = ai_msg.content
        # Xử lý trường hợp LLM bị ảo giác trả về JSON thay vì text
        try:
            if content.strip().startswith("{") and content.strip().endswith("}"):
                parsed = json.loads(content)
                if "parameters" in parsed and isinstance(parsed["parameters"], dict) and "message" in parsed["parameters"]:
                    return parsed["parameters"]["message"]
                if "message" in parsed:
                    return parsed["message"]
        except Exception:
            pass
            
        return content

agent_service = AgentService()