from app.services.agent_service import agent_service
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
import json

user_msg = "Đặt cho tôi bàn 4 người vào 15h thứ 5 tuần sau .Số điện thoại:0123456789.Tên :Đoàn An Minh"
messages = [
    SystemMessage(content=agent_service.system_instruction),
    HumanMessage(content=user_msg)
]

ai_msg = agent_service.llm.invoke(messages)
messages.append(ai_msg)

if ai_msg.tool_calls:
    for tool_call in ai_msg.tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]
        print(f"Tool call: {tool_name} with {tool_args}")
        chosen_tool = agent_service.tools_map[tool_name]
        tool_output = chosen_tool.invoke(tool_args)
        print(f"TOOL RETURNED: {tool_output}")
        
        messages.append(ToolMessage(
            content=str(tool_output), 
            tool_call_id=tool_call["id"]
        ))
    
    final_ai_msg = agent_service.llm.invoke(messages)
    print("Final AI:", final_ai_msg.content)
