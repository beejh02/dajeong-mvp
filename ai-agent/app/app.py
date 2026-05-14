MESSAGE = (
    "현재 화면은 AI Agent 실행 확인용 placeholder입니다. "
    "Dajeong Chat, MCP Tool 호출, 주문 후보 생성은 이후 Phase에서 연결합니다."
)


try:
    import streamlit as st
except ModuleNotFoundError:
    print("Dajeong AI Agent")
    print("Phase 1 Scaffold")
    print(MESSAGE)
else:
    st.set_page_config(page_title="Dajeong AI Agent", page_icon="D")
    st.title("Dajeong AI Agent")
    st.caption("Phase 1 Scaffold")
    st.write(MESSAGE)
