package com.example.product.repository;

import com.example.product.entity.ProductSpecification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;
import com.example.product.entity.Product;

@Repository
public interface ProductSpecificationRepository extends JpaRepository<ProductSpecification, UUID> {
    void deleteAllByProduct(Product product);
    List<ProductSpecification> findByProductId(UUID productId);
}
