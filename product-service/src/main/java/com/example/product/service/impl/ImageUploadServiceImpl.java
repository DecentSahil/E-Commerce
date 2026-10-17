package com.example.product.service.impl;

import com.example.product.service.ImageUploadService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class ImageUploadServiceImpl implements ImageUploadService {

    private static final String UPLOAD_DIR = "uploads/products";
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg");

    @Override
    public String uploadImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty image file.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Image file size exceeds maximum limit of 10MB.");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }

        String contentType = file.getContentType();
        boolean isValidMime = contentType != null && contentType.startsWith("image/");
        boolean isValidExt = ALLOWED_EXTENSIONS.contains(extension);

        if (!isValidMime && !isValidExt) {
            throw new IllegalArgumentException("Only valid image formats (JPEG, PNG, WebP, GIF, SVG) are allowed.");
        }

        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String uniqueFilename = UUID.randomUUID() + (extension.isEmpty() ? ".jpg" : extension);
            Path destination = uploadPath.resolve(uniqueFilename);

            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            log.info("Product image uploaded successfully: {} -> {}", originalFilename, destination);

            return "/api/v1/products/images/" + uniqueFilename;
        } catch (IOException e) {
            log.error("Failed to store uploaded image: {}", originalFilename, e);
            throw new RuntimeException("Failed to save uploaded image: " + e.getMessage(), e);
        }
    }
}
