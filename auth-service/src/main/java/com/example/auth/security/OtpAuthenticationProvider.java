package com.example.auth.security;

import com.example.auth.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

@RequiredArgsConstructor
@Component
public class OtpAuthenticationProvider implements AuthenticationProvider {

    private final OtpService otpService;
    private final UserDetailsService userDetailsService;
    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        OtpAuthenticationToken otpToken = (OtpAuthenticationToken) authentication;
        String email = (String) otpToken.getPrincipal();
        String otp = (String) otpToken.getCredentials();
        otpService.verifyOtp(email,otp);
        UserDetails user = userDetailsService.loadUserByUsername(email);
        return new OtpAuthenticationToken(user,user.getAuthorities());
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return OtpAuthenticationToken.class
                .isAssignableFrom(authentication);
    }
}
