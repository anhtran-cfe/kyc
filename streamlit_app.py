import streamlit as st
import google.generativeai as genai
import pandas as pd
from pathlib import Path
import tempfile
import os

st.set_page_config(
    page_title="PDF to Excel Converter",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="collapsed"
)

st.markdown("""
    <style>
    [data-testid="stSidebar"] {
        display: none;
    }
    
    .main-header {
        text-align: center;
        padding: 2rem 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 10px;
        margin-bottom: 2rem;
    }
    .main-header h1 {
        margin: 0;
        font-size: 2.5rem;
        font-weight: 700;
    }
    .main-header p {
        margin: 0.5rem 0 0 0;
        font-size: 1.1rem;
        opacity: 0.9;
    }
    .login-container {
        max-width: 400px;
        margin: 5rem auto;
        padding: 2rem;
        background: white;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .login-header {
        text-align: center;
        color: #667eea;
        margin-bottom: 2rem;
    }
    .footer {
        text-align: center;
        padding: 2rem 0;
        color: #666;
        border-top: 1px solid #e5e5e5;
        margin-top: 3rem;
    }
    .stButton>button {
        width: 100%;
        background-color: #667eea;
        color: white;
        font-weight: 600;
        padding: 0.75rem;
        border-radius: 8px;
        border: none;
        font-size: 1.1rem;
    }
    .stButton>button:hover {
        background-color: #764ba2;
        border: none;
    }
    .upload-section {
        background-color: #f8fafc;
        padding: 2rem;
        border-radius: 10px;
        border: 2px dashed #cbd5e1;
        margin: 2rem 0;
    }
    .info-box {
        background-color: #f3f4f6;
        border-left: 4px solid #667eea;
        padding: 1rem;
        border-radius: 5px;
        margin: 1rem 0;
    }
    </style>
""", unsafe_allow_html=True)

if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False
if 'username' not in st.session_state:
    st.session_state.username = None

def verify_credentials(username, password):
    try:
        # Simple check - get users from secrets
        users = st.secrets.get("users", {})
        
        # Check if username exists and password matches
        if username in users:
            if users[username] == password:
                return True
        
        return False
    except Exception as e:
        st.error(f"Configuration error: {str(e)}")
        return False

def login_page():
    st.markdown("""
        <div class="main-header">
            <h1>📊 PDF to Excel Converter</h1>
            <p>Transform your documents instantly</p>
        </div>
    """, unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown('<div class="login-container">', unsafe_allow_html=True)
        st.markdown('<h2 class="login-header">🔐 Login</h2>', unsafe_allow_html=True)
        
        with st.form("login_form"):
            username = st.text_input("Username", placeholder="Enter your username")
            password = st.text_input("Password", type="password", placeholder="Enter your password")
            submit = st.form_submit_button("Login", use_container_width=True)
            
            if submit:
                if username and password:
                    if verify_credentials(username, password):
                        st.session_state.logged_in = True
                        st.session_state.username = username
                        st.rerun()
                    else:
                        st.error("❌ Invalid username or password")
                else:
                    st.warning("⚠️ Please enter both username and password")
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    st.markdown("""
        <div class='footer'>
            <p style='font-size: 0.9rem; color: #888;'>
                Created by Phương Anh
            </p>
        </div>
    """, unsafe_allow_html=True)

def main_app():
    col1, col2 = st.columns([6, 1])
    with col2:
        if st.button("🚪 Logout", key="logout_btn"):
            st.session_state.logged_in = False
            st.session_state.username = None
            st.rerun()
    
    try:
        api_key = st.secrets["GOOGLE_API_KEY"]
        genai.configure(api_key=api_key)
        model_name = "gemini-2.0-flash-exp"
        system_ready = True
    except Exception as e:
        system_ready = False

    st.markdown("""
        <div class="main-header">
            <h1>📊 PDF to Excel Converter</h1>
            <p>Convert your PDF documents to Excel format instantly</p>
        </div>
    """, unsafe_allow_html=True)
    
    st.markdown(f"### 👋 Welcome, {st.session_state.username}!")
    st.markdown("---")

    if system_ready:
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            st.markdown("""
            <div class="info-box">
                <h3 style="margin-top: 0;">📋 How to use:</h3>
                <ol style="margin-bottom: 0;">
                    <li>Upload your PDF file (max 200MB)</li>
                    <li>Click "Convert to Excel"</li>
                    <li>Download your converted file</li>
                </ol>
            </div>
            """, unsafe_allow_html=True)
        
        st.markdown("<div class='upload-section'>", unsafe_allow_html=True)
        
        st.markdown("### 📤 Upload Your PDF")
        uploaded_file = st.file_uploader(
            "Choose a PDF file",
            type=['pdf'],
            help="Maximum file size: 200MB",
            label_visibility="collapsed"
        )
        
        st.markdown("</div>", unsafe_allow_html=True)
        
        if uploaded_file:
            col1, col2, col3 = st.columns([1, 2, 1])
            with col2:
                st.info(f"📄 **Selected File:** {uploaded_file.name} ({uploaded_file.size / 1024:.2f} KB)")
            
            custom_prompt = """Analyze this PDF document and extract all tabular data. 
Convert the information into a structured format suitable for Excel.
Include all relevant columns and rows, maintaining the original structure as much as possible.
Return the data in a clear, organized format."""
            
            with st.expander("⚙️ Advanced Extraction Options (Optional)"):
                st.markdown("Customize how the data is extracted from your PDF:")
                
                extraction_mode = st.radio(
                    "Extraction Mode:",
                    ["Automatic (Recommended)", "Custom Instructions"],
                    index=0
                )
                
                if extraction_mode == "Custom Instructions":
                    custom_prompt = st.text_area(
                        "Custom extraction instructions:",
                        value="""Extract all tabular data from this PDF document.
Maintain the original structure with all columns and rows.
Format the output as a clear, organized table.""",
                        height=120
                    )
            
            col1, col2, col3 = st.columns([1, 2, 1])
            with col2:
                convert_button = st.button("🚀 Convert to Excel", type="primary")
            
            if convert_button:
                with st.spinner("⏳ Converting your file... This may take a moment."):
                    try:
                        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                            tmp_file.write(uploaded_file.getvalue())
                            tmp_path = tmp_file.name
                        
                        uploaded_file_obj = genai.upload_file(tmp_path)
                        model = genai.GenerativeModel(model_name)
                        response = model.generate_content([uploaded_file_obj, custom_prompt])
                        
                        st.success("✅ Conversion completed successfully!")
                        
                        st.markdown("### 📊 Conversion Results")
                        
                        tab1, tab2 = st.tabs(["📝 Preview", "📥 Download"])
                        
                        with tab1:
                            st.markdown("**Extracted Content:**")
                            st.text_area(
                                "Preview",
                                value=response.text,
                                height=400,
                                label_visibility="collapsed"
                            )
                        
                        with tab2:
                            col1, col2 = st.columns(2)
                            
                            with col1:
                                st.download_button(
                                    label="📄 Download as Text File",
                                    data=response.text,
                                    file_name=f"{Path(uploaded_file.name).stem}_converted.txt",
                                    mime="text/plain",
                                    use_container_width=True
                                )
                            
                            with col2:
                                try:
                                    lines = response.text.strip().split('\n')
                                    
                                    if '|' in lines[0] or ',' in lines[0] or '\t' in lines[0]:
                                        delimiter = '|' if '|' in lines[0] else ',' if ',' in lines[0] else '\t'
                                        
                                        if '|' in lines[0]:
                                            lines = [line for line in lines if '|' in line and not line.strip().startswith('|--')]
                                        
                                        data = [line.split(delimiter) for line in lines]
                                        data = [[cell.strip() for cell in row] for row in data]
                                        data = [row for row in data if any(cell.strip() for cell in row)]
                                        
                                        if len(data) > 1:
                                            df = pd.DataFrame(data[1:], columns=data[0])
                                            
                                            output = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
                                            df.to_excel(output.name, index=False, engine='openpyxl')
                                            
                                            with open(output.name, 'rb') as f:
                                                st.download_button(
                                                    label="📊 Download as Excel",
                                                    data=f.read(),
                                                    file_name=f"{Path(uploaded_file.name).stem}_converted.xlsx",
                                                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                                    use_container_width=True
                                                )
                                            
                                            with st.expander("👀 Preview Excel Data"):
                                                st.dataframe(df, use_container_width=True)
                                            
                                            os.unlink(output.name)
                                        else:
                                            st.info("💡 The extracted data doesn't appear to be in a standard table format. You can download it as a text file.")
                                    else:
                                        st.info("💡 The extracted data doesn't appear to be in a table format. You can download it as a text file and format it manually in Excel.")
                                except Exception as e:
                                    st.info("💡 Download the text file and open it in Excel to format the data manually.")
                        
                        os.unlink(tmp_path)
                        
                    except Exception as e:
                        st.error("❌ Unable to process the file. Please check your PDF and try again.")
                        st.info("💡 Tip: Make sure your PDF contains readable text and tables.")
                        
    else:
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            st.error("⚠️ Service temporarily unavailable")
            st.info("Please contact the administrator for support.")

    st.markdown("""
        <div class='footer'>
            <p style='font-size: 0.9rem; color: #888;'>
                Created by Phương Anh
            </p>
        </div>
    """, unsafe_allow_html=True)

if st.session_state.logged_in:
    main_app()
else:
    login_page()
