package com.restaurant.service.auth.impl;

import com.restaurant.common.enums.UserStatus;
import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.dto.request.auth.RegisterRequest;
import com.restaurant.dto.response.auth.UserResponse;
import com.restaurant.model.User;
import com.restaurant.repository.UserRepository;
import com.restaurant.service.auth.UserManagementService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import com.restaurant.model.Role;
import com.restaurant.repository.RoleRepository;

@Service
@RequiredArgsConstructor
public class UserManagementServiceImpl implements UserManagementService {

    private static final Logger logger = LoggerFactory.getLogger(UserManagementServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;

    @Override
    public Page<UserResponse> getUsers(String role, String status, Pageable pageable) {
        if (role != null) {
            return userRepository.findByRoles_Name(role.toUpperCase(), pageable)
                    .map(this::buildUserResponse);
        }
        if (status != null) {
            return userRepository.findByStatus(UserStatus.valueOf(status.toUpperCase()), pageable)
                    .map(this::buildUserResponse);
        }
        return userRepository.findAll(pageable).map(this::buildUserResponse);
    }

    @Override
    public UserResponse getUserById(UUID id) {
        User user = findUserOrThrow(id);
        return buildUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse createUser(RegisterRequest request, UUID createdBy) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email is already in use");
        }

        String employeeId = generateEmployeeId();

        Set<Role> roles = new HashSet<>(roleRepository.findAllById(request.getRoleIds()));

        User user = User.builder()
                .employeeId(employeeId)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .roles(roles)
                .createdBy(createdBy)
                .build();

        userRepository.save(user);
        return buildUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUser(UUID id, RegisterRequest request) {
        User user = findUserOrThrow(id);

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        
        if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
            Set<Role> roles = new HashSet<>(roleRepository.findAllById(request.getRoleIds()));
            user.setRoles(roles);
        }

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new BusinessException("Email is already in use");
            }
            user.setEmail(request.getEmail());
        }

        userRepository.save(user);
        return buildUserResponse(user);
    }

    @Override
    @Transactional
    public void lockUser(UUID id) {
        User user = findUserOrThrow(id);
        user.setStatus(UserStatus.LOCKED);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void unlockUser(UUID id) {
        User user = findUserOrThrow(id);
        user.setStatus(UserStatus.ACTIVE);
        user.setFailedAttempts(0);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void resetUserPassword(UUID id) {
        User user = findUserOrThrow(id);
        String temporaryPassword = UUID.randomUUID().toString().substring(0, 8);
        user.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        user.setFailedAttempts(0);
        userRepository.save(user);

        // TODO: send temporary password via email
        logger.info("Password reset for user {}: temporary password = {}", user.getEmail(), temporaryPassword);
    }

    private User findUserOrThrow(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("User not found"));
    }

    private String generateEmployeeId() {
        long userCount = userRepository.count();
        return String.format("EMP%05d", userCount + 1);
    }

    private UserResponse buildUserResponse(User user) {
        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        return UserResponse.builder()
                .id(user.getId())
                .employeeId(user.getEmployeeId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .roles(roleNames)
                .status(user.getStatus())
                .build();
    }
}
