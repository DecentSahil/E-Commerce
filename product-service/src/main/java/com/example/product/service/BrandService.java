package com.example.product.service;

import com.example.product.dto.request.BrandRequest;
import com.example.product.dto.response.BrandResponse;

import java.util.List;
import java.util.UUID;

public interface BrandService {

    List<BrandResponse> getAllBrands();

    BrandResponse getBrandById(UUID id);

    BrandResponse createBrand(BrandRequest request);

    BrandResponse updateBrand(UUID id, BrandRequest request);

    void deleteBrand(UUID id);
}
