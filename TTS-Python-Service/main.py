import os
import uuid
import re
import logging
from typing import List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import edge_tts
import cloudinary
import cloudinary.uploader


# ==========================================
# 0. CẤU HÌNH LOGGER ĐỂ DỄ DÀNG DEBUG
# ==========================================
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ==========================================
# 1. CẤU HÌNH CLOUDINARY
# ==========================================
cloudinary.config(
    cloud_name="dwlmpibpc",
    api_key="713195285545435",
    api_secret="FPtspxNYx4AIOMpCoa5qQRBDmEU",
    secure=True
)

app = FastAPI()

# Schema: Nhận một danh sách các đoạn text thay vì 1 đoạn text dài
class TTSRequest(BaseModel):
    text_chunks: List[str]
    voice: str

# ==========================================
# 2. BỘ CÔNG THỨC PHA CHẾ GIỌNG ĐỌC
# ==========================================
VOICE_PROFILES = {
    "banmai": {"voice": "vi-VN-HoaiMyNeural", "pitch": "+0Hz", "rate": "+0%"},
    "thuminh": {"voice": "en-US-AriaNeural", "pitch": "+0Hz", "rate": "+0%"},
    "ngoclam": {"voice": "en-US-JennyNeural", "pitch": "+0Hz",  "rate": "+0%"},
    "leminh": {"voice": "vi-VN-NamMinhNeural", "pitch": "+0Hz", "rate": "+0%"},
    "giahuy": {"voice": "en-US-GuyNeural", "pitch": "+0Hz", "rate": "+0%"},
    "baotin": {"voice": "en-US-ChristopherNeural", "pitch": "+0Hz", "rate": "+0%"},
    "vyvy": {"voice": "fr-FR-VivienneMultilingualNeural", "pitch": "+0Hz", "rate": "+0%"},
    "phuocloc": {"voice": "de-DE-FlorianMultilingualNeural", "pitch": "+0Hz", "rate": "+0%"},
    "nanami": {"voice": "ja-JP-NanamiNeural", "pitch": "+0Hz", "rate": "+0%"},
    "keita": {"voice": "ja-JP-KeitaNeural", "pitch": "+0Hz", "rate": "+0%"}
}

# Tiện ích làm sạch văn bản
def clean_text(text: str) -> str:
    cleaned = re.sub(r'<.*?>', ' ', text)
    return re.sub(r'\s+', ' ', cleaned).strip()

# ==========================================
# 3. API XỬ LÝ CHUYỂN ĐỔI VÀ NỐI ÂM THANH
# ==========================================
@app.post("/api/generate-audio")
async def generate_audio(request: TTSRequest):
    temp_files = [] # Danh sách các file rác cần dọn dẹp
    final_filename = f"final_audio_{uuid.uuid4().hex}.mp3"
    
    try:
        requested_voice = request.voice.lower().strip()
        profile = VOICE_PROFILES.get(
            requested_voice, 
            {"voice": "vi-VN-HoaiMyNeural", "pitch": "+0Hz", "rate": "+0%"}
        )
        
        # 1. Làm sạch danh sách text chunks
        valid_chunks = [clean_text(chunk) for chunk in request.text_chunks if clean_text(chunk)]
        
        if not valid_chunks:
            logger.warning("Văn bản rỗng. Trả về âm thanh trống.")
            return {
                "status": "success",
                "audio_url": "https://raw.githubusercontent.com/anars/blank-audio/master/250-milliseconds-of-silence.mp3"
            }

        logger.info(f"Bắt đầu đọc: {requested_voice} | Số lượng chunks: {len(valid_chunks)}")

        # Tham số cấu hình cho Edge TTS
        kwargs = {}
        if profile.get("rate") and profile["rate"] != "+0%":
            kwargs["rate"] = profile["rate"]
        if profile.get("pitch") and profile["pitch"] != "+0Hz":
            kwargs["pitch"] = profile["pitch"]

        # 2. Đọc từng đoạn text và lưu thành các file temp mp3
        for i, chunk in enumerate(valid_chunks):
            temp_filename = f"chunk_{uuid.uuid4().hex}_{i}.mp3"
            
            try:
                communicate = edge_tts.Communicate(
                    text=chunk, 
                    voice=profile["voice"], 
                    **kwargs
                )
                await communicate.save(temp_filename)
                temp_files.append(temp_filename)
                logger.info(f" Đã xử lý xong chunk {i + 1}/{len(valid_chunks)}")
            except edge_tts.exceptions.NoAudioReceived:
                logger.warning(f" Chunk {i + 1} bị lỗi (chỉ chứa ký tự không thể đọc). Đã bỏ qua đoạn này.")
                continue
            except Exception as chunk_error:
                import traceback
                chunk_err_details = traceback.format_exc()
                logger.warning(f" Lỗi không mong muốn ở chunk {i + 1}:\n{chunk_err_details}\nĐã bỏ qua đoạn này.")
                continue

        if not temp_files:
            logger.warning("Toàn bộ các chunk đều không thể đọc được. Trả về file âm thanh trống.")
            return {
                "status": "success",
                "audio_url": "https://raw.githubusercontent.com/anars/blank-audio/master/250-milliseconds-of-silence.mp3"
            }

        # 3. Ghép nối toàn bộ file âm thanh lại làm một bằng Binary (Không cần FFMPEG)
        logger.info("Đang ghép nối các đoạn âm thanh (chế độ Binary)...")
        
        with open(final_filename, 'wb') as outfile:
            for file in temp_files:
                with open(file, 'rb') as infile:
                    outfile.write(infile.read())
                    
        temp_files.append(final_filename) # Đưa vào danh sách dọn dẹp
        
        # 4. Upload file hoàn chỉnh duy nhất lên Cloudinary
        logger.info("Tiến hành Upload lên Cloudinary...")
        upload_result = cloudinary.uploader.upload(
            final_filename, 
            resource_type="video", 
            folder="audiobooks"
        )
        
        final_url = upload_result["secure_url"]
        logger.info(f"Hoàn tất Upload! Link: {final_url}")
        
        return {
            "status": "success",
            "audio_url": final_url
        }

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"================ CHI TIẾT LỖI HỆ THỐNG ================\n{error_details}\n========================================================")
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # 5. DỌN DẸP BỘ NHỚ (Cleanup)
        # Khối finally đảm bảo dù thành công hay lỗi, server vẫn xóa file tạm để không tràn ổ cứng
        logger.info("Bắt đầu dọn dẹp file tạm local...")
        for file in temp_files:
            if os.path.exists(file):
                try:
                    os.remove(file)
                    logger.debug(f"Đã xóa file: {file}")
                except Exception as cleanup_error:
                    logger.warning(f"Không thể xóa file {file}: {str(cleanup_error)}")