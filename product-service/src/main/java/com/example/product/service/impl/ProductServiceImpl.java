package com.example.product.service.impl;

import com.example.product.dto.request.CreateProductRequest;
import com.example.product.dto.request.PatchProductRequest;
import com.example.product.dto.request.ProductSpecificationRequest;
import com.example.product.dto.request.UpdateProductRequest;
import com.example.product.dto.response.PageResponse;
import com.example.product.dto.response.ProductResponse;
import com.example.product.entity.*;
import com.example.product.event.ProductEventPublisher;
import com.example.product.exception.ResourceNotFoundException;
import com.example.product.mapper.ProductMapper;
import com.example.product.repository.*;
import com.example.product.service.ProductService;
import com.example.product.specification.ProductFilterCriteria;
import com.example.product.specification.ProductFilterSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductSpecificationRepository productSpecificationRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final TagRepository tagRepository;
    private final ProductMapper productMapper;
    private final ProductEventPublisher eventPublisher;

    @Override
    @Transactional
    public ProductResponse createProduct(CreateProductRequest request) {

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Category not found with ID: " + request.getCategoryId()
                        )
                );

        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Brand not found with ID: " + request.getBrandId()
                        )
                );

        Set<Tag> tags = resolveOrCreateTags(request.getTags());

        Product product = Product.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .category(category)
                .brand(brand)
                .status(
                        request.getStatus() != null
                                ? request.getStatus()
                                : ProductStatus.ACTIVE
                )
                .tags(tags)
                .build();

        addSpecifications(product, request.getSpecifications());

        Product saved = productRepository.save(product);

        eventPublisher.publishProductCreated(
                saved.getId(),
                saved.getName(),
                saved.getCategory().getName(),
                saved.getBrand().getName()
        );

        return productMapper.toResponse(saved);
    }


    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductById(UUID id) {

        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Product not found with ID: " + id
                        )
                );

        return productMapper.toResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getProducts(
            ProductFilterCriteria criteria,
            Pageable pageable
    ) {

        Page<Product> page = productRepository.findAll(
                ProductFilterSpecification.withCriteria(criteria),
                pageable
        );

        Page<ProductResponse> responsePage =
                page.map(productMapper::toResponse);

        return PageResponse.fromPage(responsePage);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(
            UUID id,
            UpdateProductRequest request
    ) {

        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Product not found with ID: " + id
                        )
                );

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Category not found with ID: " + request.getCategoryId()
                        )
                );

        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Brand not found with ID: " + request.getBrandId()
                        )
                );

        Set<Tag> tags = resolveOrCreateTags(request.getTags());

        product.setName(request.getName().trim());
        product.setDescription(request.getDescription());
        product.setCategory(category);
        product.setBrand(brand);
        product.setStatus(request.getStatus());
        product.setTags(tags);

        updateSpecifications(
                product,
                request.getSpecifications()
        );

        Product updated = productRepository.save(product);

        eventPublisher.publishProductUpdated(
                updated.getId(),
                updated.getName(),
                updated.getCategory().getName(),
                updated.getBrand().getName(),
                updated.getStatus().name()
        );

        return productMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public ProductResponse patchProduct(
            UUID id,
            PatchProductRequest request
    ) {

        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Product not found with ID: " + id
                        )
                );

        if (request.getName() != null) {
            product.setName(request.getName().trim());
        }

        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }

        if (request.getCategoryId() != null) {

            Category category = categoryRepository.findById(
                            request.getCategoryId()
                    )
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Category not found with ID: "
                                            + request.getCategoryId()
                            )
                    );

            product.setCategory(category);
        }

        if (request.getBrandId() != null) {

            Brand brand = brandRepository.findById(
                            request.getBrandId()
                    )
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Brand not found with ID: "
                                            + request.getBrandId()
                            )
                    );

            product.setBrand(brand);
        }

        if (request.getStatus() != null) {
            product.setStatus(request.getStatus());
        }

        if (request.getTags() != null) {
            product.setTags(
                    resolveOrCreateTags(request.getTags())
            );
        }

        if (request.getSpecifications() != null) {
            updateSpecifications(
                    product,
                    request.getSpecifications()
            );
        }

        Product updated = productRepository.save(product);

        eventPublisher.publishProductUpdated(
                updated.getId(),
                updated.getName(),
                updated.getCategory().getName(),
                updated.getBrand().getName(),
                updated.getStatus().name()
        );

        return productMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteProduct(UUID id) {

        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Product not found with ID: " + id
                        )
                );

        product.setStatus(ProductStatus.INACTIVE);

        productRepository.save(product);

        eventPublisher.publishProductUpdated(
                product.getId(),
                product.getName(),
                product.getCategory().getName(),
                product.getBrand().getName(),
                product.getStatus().name()
        );
    }

    private void addSpecifications(
            Product product,
            List<ProductSpecificationRequest> specifications
    ) {

        if (specifications == null || specifications.isEmpty()) {
            return;
        }

        for (ProductSpecificationRequest specRequest : specifications) {

            ProductSpecification specification =
                    ProductSpecification.builder()
                            .product(product)
                            .specKey(specRequest.getKey())
                            .specValue(specRequest.getValue())
                            .build();

            product.addSpecification(specification);
        }
    }


    private void updateSpecifications(
            Product product,
            List<ProductSpecificationRequest> specifications
    ) {

        productSpecificationRepository.deleteAllByProduct(product);
        productSpecificationRepository.flush();

        addSpecifications(product, specifications);
    }

    private Set<Tag> resolveOrCreateTags(
            Set<String> tagNames
    ) {

        if (tagNames == null || tagNames.isEmpty()) {
            return new HashSet<>();
        }

        Set<Tag> result = new HashSet<>();

        for (String tagName : tagNames) {

            if (tagName == null || tagName.isBlank()) {
                continue;
            }

            String trimmed = tagName.trim();

            Tag tag = tagRepository
                    .findByNameIgnoreCase(trimmed)
                    .orElseGet(() ->
                            tagRepository.save(
                                    Tag.builder()
                                            .name(trimmed)
                                            .build()
                            )
                    );

            result.add(tag);
        }

        return result;
    }
}