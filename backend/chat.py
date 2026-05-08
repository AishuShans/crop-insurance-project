import os
import logging
from google import genai
from google.genai import types
from schemas import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

# Use GEMINI_API_KEY from .env / environment
API_KEY = os.getenv("GEMINI_API_KEY")

SYSTEM_PROMPT = """
You are an expert, multilingual crop insurance assistant.

You must automatically detect the language of the user's message.
You must reply completely in the same language used by the user.

Your main tasks:
1. Explain how to file a claim.
2. Tell required documents.
3. Explain requested claim amount.
4. Explain crop insurance policies.

Rules:
- Keep answers concise.
- Be polite and professional.
- If unrelated questions are asked, politely redirect to crop insurance topics.
"""

def generate_chat_response(request: ChatRequest) -> ChatResponse:
    try:
        # If no API key -> mock response
        if not API_KEY or API_KEY == "your_api_key_here":
            msg = "AgriShield Assistant is running in demo mode. Please add GEMINI_API_KEY in your .env file."
            if request.language == 'ta':
                msg = "அக்ரிஷீல்ட் உதவியாளர் டெமோ பயன்முறையில் இயங்குகிறது. உங்கள் .env கோப்பில் GEMINI_API_KEY ஐ சேர்க்கவும்."
            return ChatResponse(
                reply=msg,
                language=request.language or "English"
            )

        # Create client
        client = genai.Client(api_key=API_KEY)

        # Build prompt
        prompt = request.message

        if request.language:
            prompt = f"""
Preferred Language: {request.language}

User Message:
{request.message}
"""

        # Generate response
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.3,
                max_output_tokens=300
            )
        )

        response_text = response.text.strip() if response.text else \
            ("மன்னிக்கவும், என்னால் பதிலை உருவாக்க முடியவில்லை." if request.language == 'ta' else "Sorry, I could not generate a response.")

        return ChatResponse(
            reply=response_text,
            language=request.language or "Auto"
        )

    except Exception as e:
        logger.error(f"Chat Error: {str(e)}")
        err_msg = "We're sorry. AI service is temporarily unavailable. Please try again later."
        if request.language == 'ta':
            err_msg = "மன்னிக்கவும். AI சேவை தற்காலிகமாக கிடைக்கவில்லை. பின்னர் மீண்டும் முயற்சிக்கவும்."

        return ChatResponse(
            reply=err_msg,
            language=request.language or "Unknown"
        )
