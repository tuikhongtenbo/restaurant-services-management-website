package com.restaurant.repository;

import com.restaurant.model.Voucher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, UUID> {

    // Tìm bằng code, loại bỏ voucher đã xoá mềm
    @Query("SELECT v FROM Voucher v WHERE v.code = :code AND v.deletedAt IS NULL")
    Optional<Voucher> findByCode(String code);

    boolean existsByCode(String code);

    // Chỉ lấy danh sách active và chưa bị xoá mềm
    @Query("SELECT v FROM Voucher v WHERE v.isActive = true AND v.deletedAt IS NULL")
    List<Voucher> findByIsActiveTrue();

    // Danh sách khả dụng: active + còn hạn + còn lượt + chưa bị xoá mềm
    @Query("SELECT v FROM Voucher v WHERE v.isActive = true " +
           "AND v.deletedAt IS NULL " +
           "AND (v.validFrom IS NULL OR v.validFrom <= CURRENT_TIMESTAMP) " +
           "AND (v.validUntil IS NULL OR v.validUntil >= CURRENT_TIMESTAMP) " +
           "AND (v.usageLimit IS NULL OR v.usedCount < v.usageLimit)")
    List<Voucher> findAvailableVouchers();

    // Phân trang tất cả voucher chưa bị xoá mềm
    @Query("SELECT v FROM Voucher v WHERE v.deletedAt IS NULL")
    Page<Voucher> findAllActive(Pageable pageable);
}
