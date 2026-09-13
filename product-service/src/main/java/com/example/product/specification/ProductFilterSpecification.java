package com.example.product.specification;

import com.example.product.entity.Brand;
import com.example.product.entity.Category;
import com.example.product.entity.Product;
import com.example.product.entity.Tag;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class ProductFilterSpecification {

    public static Specification<Product> withCriteria(
            ProductFilterCriteria criteria
    ) {

        return (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            if (criteria == null) {
                return cb.conjunction();
            }

            if (criteria.getStatus() != null) {

                predicates.add(
                        cb.equal(
                                root.get("status"),
                                criteria.getStatus()
                        )
                );
            }

            if (StringUtils.hasText(criteria.getCategory())) {

                Join<Product, Category> categoryJoin =
                        root.join(
                                "category",
                                JoinType.INNER
                        );

                predicates.add(
                        cb.equal(
                                cb.lower(categoryJoin.get("name")),
                                criteria.getCategory()
                                        .trim()
                                        .toLowerCase()
                        )
                );
            }


            if (StringUtils.hasText(criteria.getBrand())) {

                Join<Product, Brand> brandJoin =
                        root.join(
                                "brand",
                                JoinType.INNER
                        );

                predicates.add(
                        cb.equal(
                                cb.lower(brandJoin.get("name")),
                                criteria.getBrand()
                                        .trim()
                                        .toLowerCase()
                        )
                );
            }

            if (StringUtils.hasText(criteria.getTag())) {

                Join<Product, Tag> tagJoin =
                        root.join(
                                "tags",
                                JoinType.INNER
                        );

                predicates.add(
                        cb.equal(
                                cb.lower(tagJoin.get("name")),
                                criteria.getTag()
                                        .trim()
                                        .toLowerCase()
                        )
                );
            }

     if (StringUtils.hasText(criteria.getSearch())) {

                String searchPattern =
                        "%" +
                                criteria.getSearch()
                                        .trim()
                                        .toLowerCase() +
                                "%";

                Predicate nameLike =
                        cb.like(
                                cb.lower(root.get("name")),
                                searchPattern
                        );

                Predicate descriptionLike =
                        cb.like(
                                cb.lower(root.get("description")),
                                searchPattern
                        );

                predicates.add(
                        cb.or(
                                nameLike,
                                descriptionLike
                        )
                );
            }

            if (query != null) {
                query.distinct(true);
            }


            return cb.and(
                    predicates.toArray(new Predicate[0])
            );
        };
    }
}