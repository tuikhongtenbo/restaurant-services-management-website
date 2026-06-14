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
            "=== BẢNG TRA CỨU NGÀY (DÙNG ĐỂ GỌI TOOL) ===\n"
            f"{generate_date_mapping()}\n"
            "1. TRA CỨU LỊCH TRỐNG ('check_available_slots'):\n"
            "- Tự động tra bảng trên để chuyển đổi 'tối mai', 'thứ 5 tuần sau' thành 'YYYY-MM-DD'.\n"
            "- CHÚ Ý TỐI QUAN TRỌNG: Bạn BẮT BUỘC phải copy y nguyên và liệt kê ĐẦY ĐỦ TẤT CẢ các khung giờ nhận được từ kết quả của tool vào câu trả lời cuối cùng để khách hàng thấy. TUYỆT ĐỐI KHÔNG trả lời chung chung kiểu 'Tôi hy vọng thông tin hữu ích'.\n\n"
            "2. GỢI Ý SET MÓN ('suggest_set_menu'):\n"
            "- Khi khách hàng nhờ gợi ý set ăn, gợi ý món theo ngân sách (VD: 200k, 500k), gọi công cụ này.\n"
            "- Công cụ này sẽ tự động tính toán, bạn chỉ cần gán đúng biến budget là con số tiền (ví dụ: 200000).\n"
            "- TUYỆT ĐỐI không dùng tool xem menu cho việc gợi ý set ăn.\n\n"
            "3. ĐẶT BÀN ('create_restaurant_booking'):\n"
            "- BẮT BUỘC phải có đủ 4 thông tin: Tên, SĐT, Số người, Ngày giờ.\n"
            "- NẾU KHÁCH CHƯA CHO TÊN HOẶC SĐT: TUYỆT ĐỐI KHÔNG GỌI TOOL. KHÔNG TỰ BỊA TÊN/SĐT (như 'Khách hàng', '0123456789'). Hãy lịch sự hỏi lại khách.\n"
            "- Dùng 'BẢNG TRA CỨU NGÀY' ở trên để chuyển ngày khách nói sang 'YYYY-MM-DD'.\n"
            "- Cách đổi giờ: '15h' = 15:00:00; '3h chiều' = 15:00:00; '3 rưỡi chiều' = 15:30:00; '7h tối' = 19:00:00.\n"
            "- Sau đó nối ngày và giờ lại thành chuẩn ISO 8601 CÓ MÚI GIỜ (VD: 2026-06-18T15:00:00+07:00) để gọi tool.\n"
            "- Khi đặt bàn thành công, KHÔNG ĐƯỢC nhắc khách kiểm tra bằng ID. BẮT BUỘC thông báo chính xác câu sau: \"Nhân viên sẽ gọi xác nhận với khách hàng trong khoảng thời gian sớm nhất\".\n\n"
            "4. XEM MENU / THỰC ĐƠN:\n"
            "- Khi khách yêu cầu xem menu, thực đơn, hãy gọi tool 'get_restaurant_menu_for_suggestion'.\n"
            "- BẮT BUỘC phải đọc kết quả tool và in ra màn hình CHI TIẾT toàn bộ danh sách các món ăn, danh mục và giá tiền. KHÔNG ĐƯỢC TÓM TẮT hay nói chung chung.\n\n"
            "5. CHÀO HỎI:\n"
            "- Khi khách chào hỏi ('Xin chào', 'chào', 'hello',...), bạn CHỈ ĐƯỢC PHÉP in ra chính xác từng chữ của câu sau (tuyệt đối không tự sửa hay viết sai chính tả): \"Tôi là trợ lý ảo của nhà hàng, rất hân hạnh được hỗ trợ quý khách\".\n\n"
            "6. NGOÀI PHẠM VI:\n"
            "- Nếu khách nhắn một câu không liên quan đến nhà hàng, đặt bàn hay thực đơn, BẮT BUỘC trả lời: \"Xin lỗi, phần này ngoài phạm vi của tôi. Xin quý khách hãy hỏi các vấn đề liên quan đến nhà hàng\".\n\n"
            "QUY TẮC:\n"
            "- Phản hồi Tiếng Việt thân thiện, ngắn gọn.\n"
            "- Luôn sử dụng Function Calling khi cần gọi công cụ.\n"
            "- Khi không gọi công cụ, TUYỆT ĐỐI CHỈ trả về văn bản thuần túy (plain text), KHÔNG bao bọc trong định dạng JSON.\n"
            "- Luôn hiển thị chi tiết kết quả nhận được từ công cụ cho khách hàng."
        )

    def execute_chat(self, user_message: str) -> str:
        # Xử lý nhanh các câu chào hỏi cơ bản để tránh LLM sinh lỗi chính tả
        msg_lower = user_message.strip().lower()
        if msg_lower in ["xin chào", "chào", "hello", "hi", "chào bạn", "xin chào nè", "chào quán", "chào shop", "chào ad"]:
            return "Tôi là trợ lý ảo của nhà hàng, rất hân hạnh được hỗ trợ quý khách."
            
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
            for tool_call in ai_msg.tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]
                
                if tool_name in self.tools_map:
                    # Kích hoạt chạy Tool tương ứng (gọi sang Java API công khai)
                    chosen_tool = self.tools_map[tool_name]
                    tool_output = chosen_tool.invoke(tool_args)
                    
                    # Ném kết quả trả về từ Java vào mảng tin nhắn dưới dạng ToolMessage
                    messages.append(ToolMessage(
                        content=str(tool_output), 
                        tool_call_id=tool_call["id"]
                    ))
            
            # Lượt 2: Llama 3 nhìn lại chỉ dẫn hệ thống ban đầu + kết quả thực tế từ Tool để rep khách
            final_ai_msg = self.llm.invoke(messages)
            response_text = final_ai_msg.content
            
            if response_text.startswith("assistant\n\n"):
                response_text = response_text[11:]
                
            # Ép cứng việc nối kết quả Tool vào đuôi câu trả lời do Llama 3 8B hay tóm tắt lười
            if "tool_name" in locals() and "tool_output" in locals():
                if tool_name in ["check_available_slots", "suggest_set_menu", "get_restaurant_menu_for_suggestion"]:
                    response_text += f"\n\n{tool_output}"
                
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