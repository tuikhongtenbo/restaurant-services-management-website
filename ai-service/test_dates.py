from datetime import datetime, timedelta

def generate_date_mapping():
    today = datetime.now()
    days_map = {
        0: "Thứ 2", 1: "Thứ 3", 2: "Thứ 4", 3: "Thứ 5", 
        4: "Thứ 6", 5: "Thứ 7", 6: "Chủ nhật"
    }
    
    mapping_str = "BẢNG TRA CỨU NGÀY:\n"
    mapping_str += f"- Hôm nay: {today.strftime('%Y-%m-%d')}\n"
    mapping_str += f"- Ngày mai: {(today + timedelta(days=1)).strftime('%Y-%m-%d')}\n"
    mapping_str += f"- Ngày mốt: {(today + timedelta(days=2)).strftime('%Y-%m-%d')}\n"
    
    current_weekday = today.weekday()
    
    # Tính các ngày trong tuần này
    mapping_str += "- Tuần này:\n"
    for i in range(7):
        target_date = today + timedelta(days=(i - current_weekday))
        if target_date >= today:
            mapping_str += f"  + {days_map[i]} tuần này: {target_date.strftime('%Y-%m-%d')}\n"
            
    # Tính các ngày trong tuần sau
    mapping_str += "- Tuần sau:\n"
    for i in range(7):
        target_date = today + timedelta(days=(i - current_weekday + 7))
        mapping_str += f"  + {days_map[i]} tuần sau: {target_date.strftime('%Y-%m-%d')}\n"
        
    return mapping_str

print(generate_date_mapping())
