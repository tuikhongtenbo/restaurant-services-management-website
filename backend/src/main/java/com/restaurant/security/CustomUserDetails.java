package com.restaurant.security;

import com.restaurant.common.enums.UserType;
import com.restaurant.model.Customer;
import com.restaurant.model.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Getter
public class CustomUserDetails implements UserDetails {

    private final UUID id;
    private final String email;
    private final String passwordHash;
    private final Collection<? extends GrantedAuthority> authorities;
    private final UserType userType;
    private final boolean isActive;

    CustomUserDetails(UUID id, String email, String passwordHash,
                              Collection<? extends GrantedAuthority> authorities, UserType userType, boolean isActive) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.authorities = authorities;
        this.userType = userType;
        this.isActive = isActive;
    }

    public static CustomUserDetails fromUser(User user, Collection<? extends GrantedAuthority> authorities) {
        return new CustomUserDetails(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                authorities,
                UserType.EMPLOYEE,
                user.getStatus() == com.restaurant.common.enums.UserStatus.ACTIVE
        );
    }

    public static CustomUserDetails fromCustomer(Customer customer) {
        return new CustomUserDetails(
                customer.getId(),
                customer.getEmail(),
                customer.getPasswordHash(),
                List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")),
                UserType.CUSTOMER,
                customer.getStatus() == com.restaurant.common.enums.UserStatus.ACTIVE
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return isActive;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isActive;
    }
}
