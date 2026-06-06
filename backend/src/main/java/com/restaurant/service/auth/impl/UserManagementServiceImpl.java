package com.restaurant.service.auth.impl;

import com.restaurant.common.enums.UserStatus;
import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.dto.request.auth.RegisterRequest;
import com.restaurant.dto.response.auth.UserResponse;
import com.restaurant.model.Role;
import com.restaurant.model.User;
import com.restaurant.repository.RoleRepository;
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

@Service
@RequiredArgsConstructor
public class UserManagementServiceImpl implements UserManagementService {

    private static final Logger logger = LoggerFactory.getLogger(UserManagementServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Lấy danh sách nhân viên có phân trang, hỗ trợ filter theo role hoặc status
    //  - Nếu có role   → lấy theo tên role (vd: "ADMIN", "WAITER")
    //  - Nếu có status → lấy theo trạng thái (ACTIVE / LOCKED)
    //  - Không có gì   → lấy toàn bộ (phân trang)
    //  NOTE: role và status không filter đồng thời — role được ưu tiên trước
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public Page<UserResponse> getUsers(String role, String status, Pageable pageable) {
        if (role != null) {
            // Filter theo tên role — chuyển toUpperCase để đồng nhất với dữ liệu DB
            return userRepository.findByRoles_Name(role.toUpperCase(), pageable)
                    .map(this::buildUserResponse);
        }
        if (status != null) {
            // Filter theo trạng thái — parse String sang enum UserStatus
            return userRepository.findByStatus(UserStatus.valueOf(status.toUpperCase()), pageable)
                    .map(this::buildUserResponse);
        }
        // Không filter → lấy tất cả nhân viên có phân trang
        return userRepository.findAll(pageable).map(this::buildUserResponse);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Lấy thông tin một nhân viên theo id
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public UserResponse getUserById(UUID id) {
        User user = findUserOrThrow(id);
        return buildUserResponse(user);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE: Tạo tài khoản nhân viên mới
    //  1. Kiểm tra email chưa được dùng — email là định danh đăng nhập duy nhất
    //  2. Tạo mã nhân viên (employeeId) tự động theo format EMP00001, EMP00002, ...
    //  3. Lấy danh sách Role từ DB theo roleIds trong request
    //  4. Tạo User với mật khẩu đã mã hoá (BCrypt) và lưu lại
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public UserResponse createUser(RegisterRequest request, UUID createdBy) {
        // Bước 1: Kiểm tra email trùng — mỗi nhân viên chỉ có một tài khoản
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email is already in use");
        }

        // Bước 2: Tự động tạo mã nhân viên (EMP + số thứ tự 5 chữ số)
        String employeeId = generateEmployeeId();

        // Bước 3: Lấy tập Role từ DB theo danh sách roleIds được truyền vào
        Set<Role> roles = new HashSet<>(roleRepository.findAllById(request.getRoleIds()));

        // Bước 4: Tạo và lưu User — mật khẩu được mã hoá trước khi lưu
        User user = User.builder()
                .employeeId(employeeId)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .roles(roles)
                .createdBy(createdBy) // Lưu lại ai tạo tài khoản này
                .build();

        userRepository.save(user);
        return buildUserResponse(user);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE: Cập nhật thông tin nhân viên
    //  - Cập nhật fullName, phone luôn
    //  - Cập nhật roles chỉ khi request có truyền roleIds (không truyền = giữ nguyên)
    //  - Cập nhật email chỉ khi email mới khác email cũ và chưa có người dùng
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public UserResponse updateUser(UUID id, RegisterRequest request) {
        User user = findUserOrThrow(id);

        // Cập nhật thông tin cơ bản — luôn thực hiện
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());

        // Cập nhật roles — chỉ khi request có truyền danh sách roleIds
        if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
            Set<Role> roles = new HashSet<>(roleRepository.findAllById(request.getRoleIds()));
            user.setRoles(roles);
        }

        // Cập nhật email — chỉ khi email mới khác email cũ và chưa bị trùng
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new BusinessException("Email is already in use");
            }
            user.setEmail(request.getEmail());
        }

        userRepository.save(user);
        return buildUserResponse(user);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOCK: Khoá tài khoản nhân viên
    //  - Tài khoản bị khoá sẽ không thể đăng nhập
    //  - Dùng khi nhân viên vi phạm hoặc nghỉ việc tạm thời
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public void lockUser(UUID id) {
        User user = findUserOrThrow(id);
        user.setStatus(UserStatus.LOCKED);
        userRepository.save(user);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UNLOCK: Mở khoá tài khoản nhân viên
    //  - Đặt status về ACTIVE và reset bộ đếm lần nhập sai về 0
    //    (tránh trường hợp tài khoản bị khoá lại ngay sau lần đăng nhập đầu tiên)
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public void unlockUser(UUID id) {
        User user = findUserOrThrow(id);
        user.setStatus(UserStatus.ACTIVE);
        user.setFailedAttempts(0); // Reset bộ đếm để tài khoản không bị khoá ngay lần đăng nhập tiếp theo
        userRepository.save(user);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE: Xoá mềm tài khoản nhân viên
    //  - Đánh dấu deletedAt = now() để giữ lại lịch sử giao dịch (hóa đơn, audit)
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public void deleteUser(UUID id) {
        User user = findUserOrThrow(id);
        if (user.isDeleted()) {
            throw new BusinessException("User is already deleted");
        }
        user.setDeletedAt(java.time.OffsetDateTime.now());
        // Cũng có thể lock luôn khi xoá mềm
        user.setStatus(UserStatus.INACTIVE); // Nếu có INACTIVE trong UserStatus, hoặc đổi status
        userRepository.save(user);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESET PASSWORD: Quản trị viên đặt lại mật khẩu tạm thời cho nhân viên
    //  - Tạo mật khẩu ngẫu nhiên 8 ký tự từ UUID
    //  - Reset failedAttempts về 0 (mở khoá nếu đang bị khoá do nhập sai)
    //  - Ghi log mật khẩu tạm thời (admin copy và gửi thủ công cho nhân viên)
    //  TODO: Tích hợp gửi email tự động thay cho ghi log
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public void resetUserPassword(UUID id) {
        User user = findUserOrThrow(id);
        // Lấy 8 ký tự đầu của UUID để làm mật khẩu tạm thời (đủ ngẫu nhiên)
        String temporaryPassword = UUID.randomUUID().toString().substring(0, 8);
        user.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        user.setFailedAttempts(0);
        userRepository.save(user);

        // TODO: Gửi mật khẩu tạm thời qua email thay vì ghi log
        logger.info("Password reset for user {}: temporary password = {}", user.getEmail(), temporaryPassword);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPER: Tìm User theo id — ném BusinessException nếu không tồn tại
    //  - Dùng chung cho nhiều hàm để tránh lặp code
    // ─────────────────────────────────────────────────────────────────────────
    private User findUserOrThrow(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("User not found"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPER: Tạo mã nhân viên tự động theo format EMP + số thứ tự 5 chữ số
    //  - Đếm tổng số user hiện có và cộng 1 để tạo thứ tự tiếp theo
    //  - VD: 0 user → EMP00001, 42 user → EMP00043
    //  NOTE: Có thể bị trùng nếu xoá user; cân nhắc dùng sequence DB cho production
    // ─────────────────────────────────────────────────────────────────────────
    private String generateEmployeeId() {
        long userCount = userRepository.count();
        return String.format("EMP%05d", userCount + 1);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPER: Map User entity → UserResponse DTO
    //  - Trích xuất tên các Role thành Set<String> để trả về cho client
    // ─────────────────────────────────────────────────────────────────────────
    private UserResponse buildUserResponse(User user) {
        // Lấy danh sách tên role (vd: "ADMIN", "WAITER") từ tập Role entities
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
