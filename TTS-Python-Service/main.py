import os
import uuid
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import edge_tts
import cloudinary
import cloudinary.uploader
import re

# ==========================================
# 1. CẤU HÌNH CLOUDINARY CỦA BẠN
# ==========================================
cloudinary.config(
    cloud_name="dwlmpibpc",
    api_key="713195285545435",
    api_secret="FPtspxNYx4AIOMpCoa5qQRBDmEU",
    secure=True
)

# ==========================================
# 2. KHỞI TẠO SERVER FASTAPI
# ==========================================
app = FastAPI()

# Khai báo định dạng dữ liệu mà Spring Boot sẽ gửi sang
class TTSRequest(BaseModel):
    text: str
    voice: str

# ==========================================
# 3. BỘ CÔNG THỨC PHA CHẾ GIỌNG ĐỌC (Mô phỏng FPT.AI)
# ==========================================
VOICE_PROFILES = {
    "banmai": {"voice": "vi-VN-HoaiMyNeural", "pitch": "+0Hz", "rate": "+0%"},
    "thuminh": {"voice": "en-US-AvaMultilingualNeural", "pitch": "+0Hz", "rate": "+0%"},
    "ngoclam": {"voice": "en-US-EmmaMultilingualNeural", "pitch": "+0Hz",  "rate": "+0%"},
    "leminh": {"voice": "vi-VN-NamMinhNeural", "pitch": "+0Hz", "rate": "+0%"},
    "giahuy": {"voice": "en-US-AndrewMultilingualNeural", "pitch": "+0Hz", "rate": "+0%"},
    "baotin": {"voice": "en-US-BrianMultilingualNeural", "pitch": "+0Hz", "rate": "+0%"},
    "vyvy": {"voice": "fr-FR-VivienneMultilingualNeural", "pitch": "+0Hz", "rate": "+0%"},
    "phuocloc": {"voice": "de-DE-FlorianMultilingualNeural", "pitch": "+0Hz", "rate": "+0%"}
}

# ==========================================
# 4. API XỬ LÝ CHUYỂN VĂN BẢN THÀNH GIỌNG NÓI
# ==========================================
@app.post("/api/generate-audio")
async def generate_audio(request: TTSRequest):
    try:
        # 4.1. Lấy mã giọng mà Java gửi sang (VD: 'banmai')
        requested_voice = request.voice.lower().strip()
        
        # Lấy công thức pha chế. Nếu mã lạ, tự động dùng giọng chuẩn mặc định
        profile = VOICE_PROFILES.get(
            requested_voice, 
            {"voice": "vi-VN-HoaiMyNeural", "pitch": "+0Hz", "rate": "+0%"}
        )
        
        print(f" Bắt đầu đọc... Giọng: {requested_voice} | Pitch: {profile['pitch']} | Tốc độ: {profile['rate']}")

        # Làm sạch HTML và các ký tự đặc biệt
        clean_text = re.sub(r'<.*?>', ' ', request.text)
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        
        if not clean_text:
            print(" Văn bản rỗng sau khi lọc HTML. Trả về âm thanh trống (bỏ qua TTS) để không làm lỗi Java.")
            return {
                "status": "success",
                "audio_url": "https://raw.githubusercontent.com/anars/blank-audio/master/250-milliseconds-of-silence.mp3"
            }

        # 4.2. Gọi AI của Microsoft đọc văn bản
        # Chỉ chèn tham số pitch/rate vào nếu nó khác mặc định để tránh lỗi prosody
        kwargs = {}
        if profile.get("rate") and profile["rate"] != "+0%":
            kwargs["rate"] = profile["rate"]
        if profile.get("pitch") and profile["pitch"] != "+0Hz":
            kwargs["pitch"] = profile["pitch"]
            
        communicate = edge_tts.Communicate(
            text=clean_text, 
            voice=profile["voice"], 
            **kwargs
        )
        
        # 4.3. Tạo ra một tên file mp3 ngẫu nhiên (tránh bị trùng tên nếu dịch nhiều đoạn)
        temp_filename = f"temp_audio_{uuid.uuid4().hex}.mp3"
        
        # Chờ AI đọc xong và lưu thành file mp3 trên máy tính
        await communicate.save(temp_filename)
        
        # 4.4. Tải file mp3 đó lên thẳng Cloudinary
        print(" AI đọc xong! Đang đẩy file lên Cloudinary...")
        upload_result = cloudinary.uploader.upload(
            temp_filename, 
            resource_type="video", # Cloudinary quy định mp3 thuộc nhóm video
            folder="audiobooks"    # Tự động cho vào thư mục audiobooks
        )
        
        # 4.5. Xóa file mp3 tạm trên máy tính cho nhẹ ổ cứng
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
            
        final_url = upload_result["secure_url"]
        print(" Hoàn tất! Link audio:", final_url)
        print("-" * 40)
        
        # 4.6. Trả đường link về cho Spring Boot
        return {
            "status": "success",
            "audio_url": final_url
        }
        
    except edge_tts.exceptions.NoAudioReceived:
        print(" Văn bản không thể đọc thành tiếng (chỉ có ký tự đặc biệt). Trả về âm thanh trống.")
        return {
            "status": "success",
            "audio_url": "https://raw.githubusercontent.com/anars/blank-audio/master/250-milliseconds-of-silence.mp3"
        }
    except Exception as e:
        print(f" Lỗi hệ thống: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))