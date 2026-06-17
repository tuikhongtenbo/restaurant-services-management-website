package com.restaurant.repository;

import com.restaurant.model.CustomerVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerVoucherRepository extends JpaRepository<CustomerVoucher, UUID> {

    // Lấy tất cả voucher được cấp cho một khách hàng (kèm thông tin voucher)
    @Query("SELECT cv FROM CustomerVoucher cv JOIN FETCH cv.voucher WHERE cv.customer.id = :customerId")
    List<CustomerVoucher> findByCustomerId(UUID customerId);

    // Kiểm tra khách hàng đã được cấp voucher cụ thể này chưa
    // Lấy thông tin cấp phát của 1 voucher cụ thể
    @Query("SELECT cv FROM CustomerVoucher cv WHERE cv.voucher.id = :voucherId")
    Optional<CustomerVoucher> findByVoucherId(UUID voucherId);
}
