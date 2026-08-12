import os
import io
import time
import logging
import requests
import numpy as np
from PIL import Image
import torch
import open_clip

logger = logging.getLogger(__name__)

# BỘ DỊCH VỤ TRÍCH XUẤT EMBEDDING BẰNG OPENCLIP
class EmbeddingService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        start_time = time.time()
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Đang khởi tạo OpenCLIP Model (ViT-B-32) trên thiết bị: {self.device}...")
        
        try:
            # ViT-B-32 chuẩn trained trên laion2b_s34b_b79k cho độ chính xác cao và nhẹ
            self.model, _, self.preprocess = open_clip.create_model_and_transforms(
                'ViT-B-32',
                pretrained='laion2b_s34b_b79k'
            )
            self.model.to(self.device)
            self.model.eval()
            elapsed = (time.time() - start_time) * 1000
            logger.info(f"Khởi tạo OpenCLIP thành công trong {elapsed:.2f}ms")
        except Exception as e:
            logger.error(f"Lỗi khởi tạo OpenCLIP Model: {e}")
            raise e

    def get_embedding_from_pil(self, pil_image: Image.Image) -> np.ndarray:
        start_time = time.time()
        try:
            rgb_image = pil_image.convert("RGB")
            processed = self.preprocess(rgb_image).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                image_features = self.model.encode_image(processed)
                # Chuẩn hóa vector L2 norm cho Cosine Similarity (Inner Product)
                image_features /= image_features.norm(dim=-1, keepdim=True)
                
            vector = image_features.cpu().numpy().astype(np.float32).flatten()
            elapsed = (time.time() - start_time) * 1000
            logger.debug(f"Tạo embedding ảnh trong {elapsed:.2f}ms")
            return vector
        except Exception as e:
            logger.error(f"Lỗi khi trích xuất embedding từ PIL Image: {e}")
            raise e

    def get_embedding_from_bytes(self, image_bytes: bytes) -> np.ndarray:
        try:
            pil_image = Image.open(io.BytesIO(image_bytes))
            return self.get_embedding_from_pil(pil_image)
        except Exception as e:
            logger.error(f"Lỗi khi đọc file ảnh bytes: {e}")
            raise ValueError(f"Không thể đọc file ảnh: {e}")

    def get_embedding_from_url_or_path(self, url_or_path: str) -> np.ndarray:
        if not url_or_path:
            raise ValueError("URL hoặc đường dẫn ảnh rỗng")

        clean_path = url_or_path.strip()
        if clean_path.startswith("books/"):
            clean_path = clean_path[6:]

        # 1. Thử đọc trực tiếp từ ổ cứng địa phương (Nhanh nhất)
        possible_local_paths = [
            clean_path,
            os.path.join("src", "main", "resources", "static", "uploads", "books", clean_path),
            os.path.join("C:\\Users\\ACER\\Java6\\src\\main\\resources\\static\\uploads\\books", clean_path),
            os.path.join("D:\\Java6\\src\\main\\resources\\static\\uploads\\books", clean_path)
        ]

        for p in possible_local_paths:
            if os.path.exists(p) and os.path.isfile(p):
                try:
                    logger.info(f"Đọc ảnh từ file local: {p}")
                    with Image.open(p) as img:
                        return self.get_embedding_from_pil(img)
                except Exception as ex:
                    logger.warning(f"Không thể mở file local {p}: {ex}")

        # 2. Nếu không tìm thấy file local hoặc là HTTP URL -> Tải qua HTTP
        http_url = clean_path
        if not (clean_path.startswith("http://") or clean_path.startswith("https://")):
            http_url = f"http://localhost:8080/uploads/books/{clean_path}"

        logger.info(f"Đang tải ảnh từ URL: {http_url}")
        try:
            response = requests.get(http_url, timeout=10)
            response.raise_for_status()
            return self.get_embedding_from_bytes(response.content)
        except Exception as e:
            logger.error(f"Thất bại khi tải ảnh từ URL {http_url}: {e}")
            raise ValueError(f"Không tải được ảnh từ URL: {http_url} | Error: {e}")
