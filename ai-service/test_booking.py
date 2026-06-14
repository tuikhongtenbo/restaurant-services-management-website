from app.services.agent_service import agent_service

user_msg = "Đặt cho tôi bàn 4 người vào 15h thứ 5 tuần sau .Số điện thoại:0123456789.Tên :Đoàn An Minh"
print("Human:", user_msg)
print("Response:", agent_service.execute_chat(user_msg))
