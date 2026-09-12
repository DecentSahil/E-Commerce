package com.example.auth.security;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

public class OtpAuthenticationToken
        extends AbstractAuthenticationToken{

    private final Object principal;
    private final Object credentials;

    public OtpAuthenticationToken(String email,String otp){
        super(null);
        this.principal = email;
        this.credentials = otp;
        setAuthenticated(false);
    }

    public OtpAuthenticationToken(Object principal, Collection<? extends GrantedAuthority> authorities){
        super(authorities);
        this.principal = principal;
        this.credentials = null;
        setAuthenticated(true);
    }


    @Override
    public Object getCredentials() {
        return principal;
    }

    @Override
    public Object getPrincipal() {
        return credentials;
    }
}