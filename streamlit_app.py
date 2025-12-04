import streamlit as st
import google.generativeai as genai
import pandas as pd
from pathlib import Path
import tempfile
import os

# Page configuration
st.set_page_config(
    page_title="PDF to Excel Converter",
    page_icon="📄",
    layout="wide"
)

# Title
st.title("📄 PDF to Excel Converter using Gemini")
st.markdown("Upload a PDF file and convert it to Excel using Google's Gemini AI")

# API Key Configuration
st.sidebar.header("⚙️ Configuration")

# Option 1: Use Streamlit secrets (recommended for deployment)
# Option 2: User input (for testing)
api_key_option = st.sidebar.radio(
    "API Key Source:",
    ["Use Streamlit Secrets", "Manual Input"]
)

if api_key_option == "Use Streamlit Secrets":
    try:
        api_key = st.secrets["GOOGLE_API_KEY"]
        st.sidebar.success("✅ API Key loaded from secrets")
    except:
        st.sidebar.error("❌ No API key found in secrets. Please add it to .streamlit/secrets.toml")
        api_key = None
else:
    api_key = st.sidebar.text_input(
        "Enter your Google API Key:",
        type="password",
        help="Get your API key from https://makersuite.google.com/app/apikey"
    )
    if api_key:
        st.sidebar.success("✅ API Key entered")

# Configure Gemini if API key is available
if api_key:
    genai.configure(api_key=api_key)
    
    # Model selection
    model_name = st.sidebar.selectbox(
        "Select Gemini Model:",
        ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"],
        index=0
    )
    
    # File uploader
    st.header("📤 Upload PDF")
    uploaded_file = st.file_uploader(
        "Choose a PDF file",
        type=['pdf'],
        help="Upload the PDF file you want to convert to Excel"
    )
    
    if uploaded_file:
        # Display file info
        st.info(f"📄 File: {uploaded_file.name} ({uploaded_file.size / 1024:.2f} KB)")
        
        # Prompt configuration
        st.header("✏️ Customize Prompt (Optional)")
        default_prompt = """Analyze this PDF document and extract all tabular data. 
        Convert the information into a structured format suitable for Excel.
        Include all relevant columns and rows, maintaining the original structure as much as possible.
        Return the data in a clear, organized format."""
        
        custom_prompt = st.text_area(
            "Custom Prompt:",
            value=default_prompt,
            height=150,
            help="Customize the prompt to guide Gemini's extraction"
        )
        
        # Process button
        if st.button("🚀 Convert to Excel", type="primary"):
            with st.spinner("Processing PDF with Gemini..."):
                try:
                    # Save uploaded file temporarily
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                        tmp_file.write(uploaded_file.getvalue())
                        tmp_path = tmp_file.name
                    
                    # Upload file to Gemini
                    uploaded_gemini_file = genai.upload_file(tmp_path)
                    st.success(f"✅ File uploaded to Gemini: {uploaded_gemini_file.name}")
                    
                    # Generate content
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content([uploaded_gemini_file, custom_prompt])
                    
                    # Display response
                    st.header("📊 Gemini Response")
                    st.markdown(response.text)
                    
                    # Try to parse response as CSV/table
                    st.header("📥 Download Options")
                    
                    # Option 1: Download as text
                    st.download_button(
                        label="💾 Download as Text",
                        data=response.text,
                        file_name=f"{Path(uploaded_file.name).stem}_output.txt",
                        mime="text/plain"
                    )
                    
                    # Option 2: Try to create Excel (if structured data)
                    try:
                        # Attempt to parse the response into a DataFrame
                        # This is a simple example - you may need to customize based on your output format
                        lines = response.text.strip().split('\n')
                        
                        # Try to detect if it's CSV-like
                        if ',' in lines[0] or '\t' in lines[0] or '|' in lines[0]:
                            # Determine delimiter
                            delimiter = ',' if ',' in lines[0] else '\t' if '\t' in lines[0] else '|'
                            
                            # Create DataFrame
                            data = [line.split(delimiter) for line in lines]
                            df = pd.DataFrame(data[1:], columns=data[0])
                            
                            # Create Excel file
                            output = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
                            df.to_excel(output.name, index=False)
                            
                            with open(output.name, 'rb') as f:
                                st.download_button(
                                    label="📊 Download as Excel",
                                    data=f.read(),
                                    file_name=f"{Path(uploaded_file.name).stem}_output.xlsx",
                                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                )
                            
                            # Display preview
                            st.subheader("Preview:")
                            st.dataframe(df)
                            
                            os.unlink(output.name)
                    except Exception as e:
                        st.warning(f"⚠️ Could not automatically convert to Excel. You can download as text and manually format it. Error: {str(e)}")
                    
                    # Cleanup
                    os.unlink(tmp_path)
                    
                except Exception as e:
                    st.error(f"❌ Error processing file: {str(e)}")
                    st.exception(e)
else:
    st.warning("⚠️ Please configure your Google API Key in the sidebar to continue.")
    st.info("""
    ### How to get your API Key:
    1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
    2. Create a new API key
    3. Copy and paste it in the sidebar
    
    ### For deployment:
    Add your API key to Streamlit secrets (recommended for security)
    """)

# Footer
st.sidebar.markdown("---")
st.sidebar.markdown("""
### 📚 Resources
- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API Docs](https://ai.google.dev/)
- [Streamlit Docs](https://docs.streamlit.io/)
""")
