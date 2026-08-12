import os           # Dùng để kiểm tra file tồn tại và xóa file tạm trên ổ cứng
import uuid          # Tạo tên file ngẫu nhiên (UUID) để tránh xung đột khi nhiều request đến cùng lúc
import re            # Thư viện Regular Expression - dùng để tìm và xóa HTML tags trong văn bản
import logging       # Ghi log ra console để theo dõi tiến trình xử lý, dễ debug khi có lỗi
import tempfile      # Lấy thư mục tạm của hệ thống (vd: C:\Users\...\AppData\Local\Temp)

# Thư mục tạm để ghi file MP3 - KHÔNG ghi vào thư mục code để tránh kích hoạt Hot Reload
TEMP_DIR = os.path.join(tempfile.gettempdir(), "tts_audio_temp")
os.makedirs(TEMP_DIR, exist_ok=True)
from typing import List, Optional               # Khai báo kiểu dữ liệu danh sách (List) cho Python
from fastapi import FastAPI, HTTPException, UploadFile, File, Form # FastAPI: framework API | UploadFile, File cho upload ảnh
from pydantic import BaseModel                  # BaseModel: định nghĩa schema + tự động validate dữ liệu đầu vào
import edge_tts                                 # Thư viện gọi engine Text-to-Speech của Microsoft Edge (miễn phí)
import cloudinary                               # SDK Cloudinary để kết nối và upload file lên Cloud
import cloudinary.uploader                      # Module upload cụ thể của Cloudinary SDK

from faiss_service import FaissService          # Import dịch vụ quản lý chỉ mục FAISS Image Search
from deep_translator import GoogleTranslator    # Import thư viện dịch tự động

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

# Khởi tạo ứng dụng FastAPI
app = FastAPI(title="Bibliora Multi-Service Python API", version="2.0.0")

@app.on_event("startup")
async def startup_event():
    logger.info("==================================================")
    logger.info("Khởi động FastAPI Server - Đang nạp FAISS Index vào bộ nhớ...")
    try:
        faiss_svc = FaissService()
        logger.info(f"FAISS Index đã sẵn sàng với {faiss_svc.index.ntotal} vector sách.")
    except Exception as e:
        logger.error(f"Cảnh báo: Không thể tải FAISS Index khi khởi động: {e}")
    logger.info("==================================================")

# ==========================================
# ĐỊNH NGHĨA SCHEMA DỮ LIỆU ĐẦU VÀO (Pydantic Models)
# ==========================================
class TTSRequest(BaseModel):
    text_chunks: List[str]
    voice: str

class BookIndexItem(BaseModel):
    book_id: int
    image_url: str

class BuildIndexRequest(BaseModel):
    books: List[BookIndexItem]

# ==========================================
# 2. BỘ CÔNG THỨC PHA CHẾ GIỌNG ĐỌC TTS
# ==========================================
VOICE_PROFILES = {
    "banmai":   {"voice": "vi-VN-HoaiMyNeural",               "pitch": "+0Hz", "rate": "+0%"},
    "thuminh":  {"voice": "en-US-AriaNeural",                  "pitch": "+0Hz", "rate": "+0%"},
    "ngoclam":  {"voice": "en-US-JennyNeural",                 "pitch": "+0Hz", "rate": "+0%"},
    "leminh":   {"voice": "vi-VN-NamMinhNeural",               "pitch": "+0Hz", "rate": "+0%"},
    "giahuy":   {"voice": "en-US-GuyNeural",                   "pitch": "+0Hz", "rate": "+0%"},
    "baotin":   {"voice": "en-US-ChristopherNeural",           "pitch": "+0Hz", "rate": "+0%"},
    "vyvy":     {"voice": "fr-FR-VivienneMultilingualNeural",  "pitch": "+0Hz", "rate": "+0%"},
    "phuocloc": {"voice": "de-DE-FlorianMultilingualNeural",   "pitch": "+0Hz", "rate": "+0%"},
    "nanami":   {"voice": "ja-JP-NanamiNeural",                "pitch": "+0Hz", "rate": "+0%"},
    "keita":    {"voice": "ja-JP-KeitaNeural",                 "pitch": "+0Hz", "rate": "+0%"}
}

def clean_text(text: str) -> str:
    cleaned = re.sub(r'<.*?>', ' ', text)
    return re.sub(r'\s+', ' ', cleaned).strip()

# ==========================================
# 3. API ENDPOINT TTS: XỬ LÝ CHUYỂN ĐỔI VÀ NỐI ÂM THANH
# ==========================================
@app.post("/api/generate-audio")
async def generate_audio(request: TTSRequest):
    temp_files = []
    final_filename = os.path.join(TEMP_DIR, f"final_audio_{uuid.uuid4().hex}.mp3")
    
    try:
        requested_voice = request.voice.lower().strip()
        profile = VOICE_PROFILES.get(
            requested_voice,
            {"voice": "vi-VN-HoaiMyNeural", "pitch": "+0Hz", "rate": "+0%"}
        )
        
        valid_chunks = [clean_text(chunk) for chunk in request.text_chunks if clean_text(chunk)]
        
        if not valid_chunks:
            logger.warning("Văn bản rỗng. Trả về âm thanh trống.")
            return {
                "status": "success",
                "audio_url": "https://raw.githubusercontent.com/anars/blank-audio/master/250-milliseconds-of-silence.mp3"
            }

        logger.info(f"Bắt đầu đọc TTS: {requested_voice} | Chunks: {len(valid_chunks)}")

        kwargs = {}
        if profile.get("rate") and profile["rate"] != "+0%":
            kwargs["rate"] = profile["rate"]
        if profile.get("pitch") and profile["pitch"] != "+0Hz":
            kwargs["pitch"] = profile["pitch"]

        # 🚀 TÍNH NĂNG MỚI: TỰ ĐỘNG DỊCH NGÔN NGỮ 🚀
        # Xác định ngôn ngữ đích dựa trên tiền tố của mã giọng đọc (vd: 'en-US' -> 'en', 'fr-FR' -> 'fr')
        voice_code = profile["voice"]
        target_lang = voice_code.split('-')[0] if '-' in voice_code else 'vi'
        
        logger.info(f"Ngôn ngữ đích: {target_lang}")

        for i, chunk in enumerate(valid_chunks):
            temp_filename = os.path.join(TEMP_DIR, f"chunk_{uuid.uuid4().hex}_{i}.mp3")
            try:
                text_to_read = chunk
                # Nếu giọng đọc KHÔNG phải tiếng Việt, tiến hành tự động dịch text trước khi đọc
                if target_lang != 'vi':
                    try:
                        logger.info(f"Đang dịch đoạn {i} sang {target_lang}...")
                        text_to_read = GoogleTranslator(source='auto', target=target_lang).translate(chunk)
                    except Exception as trans_err:
                        logger.error(f"Lỗi dịch thuật: {trans_err}. Sẽ thử đọc bản gốc.")
                
                communicate = edge_tts.Communicate(
                    text=text_to_read,
                    voice=profile["voice"],
                    **kwargs
                )
                await communicate.save(temp_filename)
                temp_files.append(temp_filename)
            except edge_tts.exceptions.NoAudioReceived:
                continue
            except Exception as chunk_error:
                continue

        if not temp_files:
            return {
                "status": "success",
                "audio_url": "https://raw.githubusercontent.com/anars/blank-audio/master/250-milliseconds-of-silence.mp3"
            }

        with open(final_filename, 'wb') as outfile:
            for file in temp_files:
                with open(file, 'rb') as infile:
                    outfile.write(infile.read())
                    
        temp_files.append(final_filename)
        
        upload_result = cloudinary.uploader.upload(
            final_filename,
            resource_type="video",
            folder="audiobooks"
        )
        
        return {
            "status": "success",
            "audio_url": upload_result["secure_url"]
        }

    except Exception as e:
        import traceback
        logger.error(f"Lỗi TTS: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        for file in temp_files:
            if os.path.exists(file):
                try:
                    os.remove(file)
                except Exception:
                    pass

# ==========================================
# 4. API ENDPOINTS: TÌM KIẾM SÁCH BẰNG HÌNH ẢNH (OPENCLIP + FAISS)
# ==========================================

@app.post("/api/image-search")
async def image_search(image: UploadFile = File(...), top_k: int = Form(10)):
    """
    Nhận file ảnh tải lên từ Spring Boot, trích xuất OpenCLIP embedding, 
    tìm kiếm trong FAISS Index và trả về danh sách [{'book_id': 15, 'similarity': 0.97}, ...]
    """
    logger.info(f"Nhận request tìm kiếm bằng hình ảnh: filename={image.filename}, top_k={top_k}")
    try:
        contents = await image.read()
        if not contents:
            raise HTTPException(status_code=400, detail="File ảnh rỗng.")
            
        faiss_svc = FaissService()
        results = faiss_svc.search_image(contents, top_k=top_k)
        return results
    except Exception as e:
        logger.error(f"Lỗi trong API /api/image-search: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi xử lý tìm kiếm ảnh: {str(e)}")

@app.post("/api/index/build")
async def build_index(req: BuildIndexRequest):
    """
    Xây dựng hoặc làm mới toàn bộ FAISS Index từ danh sách sách trong Database Java.
    """
    logger.info(f"Nhận yêu cầu Rebuild FAISS Index cho {len(req.books)} sách...")
    try:
        books_data = [b.dict() for b in req.books]
        faiss_svc = FaissService()
        result = faiss_svc.build_index(books_data)
        return {"status": "success", "result": result}
    except Exception as e:
        logger.error(f"Lỗi khi Rebuild Index: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/index/update")
async def update_index_item(item: BookIndexItem):
    """
    Thêm mới hoặc cập nhật 1 sách vào FAISS Index khi Admin thêm/sửa sách.
    """
    logger.info(f"Nhận yêu cầu cập nhật Index cho sách ID={item.book_id}, image={item.image_url}")
    try:
        faiss_svc = FaissService()
        faiss_svc.add_or_update_book(item.book_id, item.image_url)
        return {"status": "success", "book_id": item.book_id}
    except Exception as e:
        logger.error(f"Lỗi khi cập nhật Index cho sách ID {item.book_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/index/delete/{book_id}")
async def delete_index_item(book_id: int):
    """
    Xóa 1 sách khỏi FAISS Index khi Admin ẩn/xóa sách.
    """
    logger.info(f"Nhận yêu cầu xóa sách ID={book_id} khỏi FAISS Index")
    try:
        faiss_svc = FaissService()
        faiss_svc.delete_book(book_id)
        return {"status": "success", "book_id": book_id}
    except Exception as e:
        logger.error(f"Lỗi khi xóa sách ID {book_id} khỏi Index: {e}")
        raise HTTPException(status_code=500, detail=str(e))