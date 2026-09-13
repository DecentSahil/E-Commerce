package com.example.product.service.impl;

import com.example.product.dto.request.BrandRequest;
import com.example.product.dto.response.BrandResponse;
import com.example.product.entity.Brand;
import com.example.product.exception.DuplicateResourceException;
import com.example.product.exception.ResourceNotFoundException;
import com.example.product.mapper.BrandMapper;
import com.example.product.repository.BrandRepository;
import com.example.product.service.BrandService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BrandServiceImpl implements BrandService {

    private final BrandRepository brandRepository;
    private final BrandMapper brandMapper;

    @Override
    @Transactional(readOnly = true)
    public List<BrandResponse> getAllBrands() {
        return brandRepository.findAll().stream()
                .map(brandMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BrandResponse getBrandById(UUID id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with ID: " + id));
        return brandMapper.toResponse(brand);
    }

    @Override
    @Transactional
    public BrandResponse createBrand(BrandRequest request) {
        String name = request.getName().trim();
        if (brandRepository.existsByNameIgnoreCase(name)) {
            throw new DuplicateResourceException("Brand already exists with name: " + name);
        }

        Brand brand = Brand.builder()
                .name(name)
                .build();

        Brand saved = brandRepository.save(brand);
        return brandMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public BrandResponse updateBrand(UUID id, BrandRequest request) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with ID: " + id));

        String name = request.getName().trim();
        if (!brand.getName().equalsIgnoreCase(name) && brandRepository.existsByNameIgnoreCase(name)) {
            throw new DuplicateResourceException("Brand already exists with name: " + name);
        }

        brand.setName(name);
        Brand updated = brandRepository.save(brand);
        return brandMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteBrand(UUID id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with ID: " + id));
        brandRepository.delete(brand);
    }
}
