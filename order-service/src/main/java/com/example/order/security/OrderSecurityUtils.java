//package com.example.order.security;
//
//import org.springframework.security.core.Authentication;
//import org.springframework.security.core.context.SecurityContextHolder;
//
//import java.util.UUID;
//
//
//public final class OrderSecurityUtils {
//
//    private OrderSecurityUtils() {}
//
//
//    public static UUID getAuthUserId() {
//        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
//        if (auth == null || auth.getDetails() == null) {
//            return null;
//        }
//        // authUserId stored in request attribute by JwtAuthenticationFilter
//        if (auth.getDetails() instanceof org.springframework.security.web.authentication.WebAuthenticationDetails details) {
//            // Fallback: principal-based extraction is handled by the filter setting the attribute
//        }
//        return null; // Resolved via request attribute in service layer
//    }
//
//
//    public static boolean isAdmin() {
//        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
//        if (auth == null) return false;
//        return auth.getAuthorities().stream()
//                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
//    }
//
//
//    public static String getCurrentEmail() {
//        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
//        return (auth != null) ? String.valueOf(auth.getPrincipal()) : null;
//    }
//}
