package com.restaurant.security;

import com.restaurant.model.Customer;
import com.restaurant.model.User;
import com.restaurant.repository.CustomerRepository;
import com.restaurant.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import com.restaurant.service.auth.RoleManagementService;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final RoleManagementService roleManagementService;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            Set<String> authStrings = roleManagementService.getUserAuthorities(user.getId());
            var authorities = authStrings.stream()
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());
            return CustomUserDetails.fromUser(user, authorities);
        }

        Optional<Customer> customerOptional = customerRepository.findByEmail(email);
        if (customerOptional.isPresent()) {
            return CustomUserDetails.fromCustomer(customerOptional.get());
        }

        throw new UsernameNotFoundException("No account found with email: " + email);
    }
}
