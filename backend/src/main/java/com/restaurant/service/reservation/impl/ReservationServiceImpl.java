package com.restaurant.service.reservation.impl;

import com.restaurant.common.enums.ReservationSource;
import com.restaurant.common.enums.ReservationStatus;
import com.restaurant.common.enums.TableStatus;
import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.dto.request.reservation.CreateReservationRequest;
import com.restaurant.dto.request.reservation.UpdateReservationRequest;
import com.restaurant.dto.response.reservation.BookingSuggestionResponse;
import com.restaurant.dto.response.reservation.ReservationCalendarResponse;
import com.restaurant.dto.response.reservation.ReservationResponse;
import com.restaurant.model.Reservation;
import com.restaurant.model.Table;
import com.restaurant.repository.ReservationRepository;
import com.restaurant.repository.TableRepository;
import com.restaurant.service.reservation.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservationServiceImpl implements ReservationService {

    // ------------------------------------------------------------------ constants

    private static final int       RESERVATION_DURATION_HOURS = 3;
    private static final int       ASSIGN_BEFORE_MINUTES      = 30;
    private static final int       AUTO_CANCEL_MINUTES        = 30;
    private static final int       SLOT_INTERVAL_MINUTES      = 30;
    private static final int       BOOKING_HORIZON_DAYS       = 30;
    private static final LocalTime OPEN_TIME                  = LocalTime.of(10, 0);
    private static final LocalTime CLOSE_TIME                 = LocalTime.of(21, 0);
    private static final ZoneId    RESTAURANT_ZONE            = ZoneId.of("Asia/Ho_Chi_Minh");

    /**
     * Trang thai "dang chiem slot" - dung thong nhat o moi cho.
     * PENDING khong block vi chua confirmed.
     */
    private static final Set<ReservationStatus> BLOCKING_STATUSES =
            Set.of(ReservationStatus.CONFIRMED, ReservationStatus.ARRIVED);

    /**
     * Dinh dang luu "ban phu" (khi ghep nhieu ban cho 1 reservation) vao truong note,
     * vi schema hien tai reservations.table_id chi luu duoc 1 UUID.
     *
     *   - COMBINED_TABLES_NOTE_PREFIX: phan text de nhan vien doc duoc bang mat.
     *   - COMBINED_TABLES_PATTERN    : phan [GHEP_BAN:id1,id2,...] de code parse lai
     *     duoc danh sach UUID ban phu khi can release/arrived.
     *
     * Day la giai phap TAM. Ve lau dai nen tach thanh bang rieng
     * reservation_combined_tables (reservation_id, table_id) de khong phai parse text.
     */
    private static final String  COMBINED_TABLES_NOTE_PREFIX = "[Ghep ban]";
    private static final String  COMBINED_TABLES_SEPARATOR   = " | ";
    private static final Pattern COMBINED_TABLES_PATTERN     =
            Pattern.compile("\\[GHEP_BAN:([0-9a-fA-F\\-,]+)\\]");

    // ------------------------------------------------------------------ dependencies

    private final ReservationRepository reservationRepository;
    private final TableRepository       tableRepository;

    // ================================================================== private helpers

    /**
     * Kiem tra con ban phu hop cho partySize vao wantedTime khong.
     *
     * Thuat toan simulate gan ban:
     *   1. Pool = tat ca ban active.
     *   2. Reservation BLOCKING da co tableId -> xoa ban do khoi pool.
     *   3. Reservation BLOCKING chua co tableId -> greedy assign ban nho nhat vua du
     *      trong pool (sap xep partySize tang dan de ban nho fill truoc, tranh lang phi ban lon).
     *   4. Pool con ban nao capacity >= partySize moi -> con cho (don le hoac ghep nhieu ban).
     */
    private boolean hasCapacity(Integer partySize, OffsetDateTime wantedTime, UUID excludeReservationId) {
        List<Table> allTables = tableRepository.findByIsActiveTrueAndDeletedAtIsNull();
        if (allTables.isEmpty()) return false;

        int totalCapacity = allTables.stream().mapToInt(Table::getCapacity).sum();
        // Chan som: neu partySize vuot ca tong capacity toan nha hang thi chac chan
        // khong bao gio du cho, khong can dung toi cac reservation khac de check tiep.
        if (partySize > totalCapacity) {
            return false;
        }

        int maxTableCapacity = allTables.stream()
                .map(Table::getCapacity)
                .max(Integer::compareTo)
                .orElse(0);

        List<Reservation> blocking = reservationRepository
                .findByReservedAtBetween(
                        wantedTime.minusHours(RESERVATION_DURATION_HOURS),
                        wantedTime.plusHours(RESERVATION_DURATION_HOURS)
                )
                .stream()
                .filter(r -> excludeReservationId == null || !excludeReservationId.equals(r.getId()))
                .filter(r -> BLOCKING_STATUSES.contains(r.getStatus()))
                .toList();

        // Step 1: xoa ban da duoc gan cu the
        Set<UUID> assignedTableIds = blocking.stream()
                .filter(r -> r.getTableId() != null)
                .map(Reservation::getTableId)
                .collect(Collectors.toSet());

        List<Table> availablePool = allTables.stream()
                .filter(t -> !assignedTableIds.contains(t.getId()))
                .collect(Collectors.toCollection(ArrayList::new));

        // Step 2: simulate gan ban cho reservation chua co tableId
        // Sap xep partySize tang dan -> ban nho duoc fill truoc, tranh lang phi ban lon
        blocking.stream()
                .filter(r -> r.getTableId() == null)
                .sorted(Comparator.comparingInt(Reservation::getPartySize))
                .forEach(r -> {
                    if (r.getPartySize() > maxTableCapacity) {
                        availablePool.removeAll(findBestTableCombination(availablePool, r.getPartySize()));
                    } else {
                        availablePool.stream()
                                .filter(t -> t.getCapacity() >= r.getPartySize())
                                .min(Comparator.comparingInt(Table::getCapacity))
                                .ifPresent(availablePool::remove);
                    }
                });

        // Step 3: con ban nao chua duoc partySize moi khong
        if (partySize > maxTableCapacity) {
            return !findBestTableCombination(availablePool, partySize).isEmpty();
        }
        return availablePool.stream().anyMatch(t -> t.getCapacity() >= partySize);
    }

    /**
     * Tong suc chua toi da cua nha hang = tong capacity cua tat ca ban active.
     * Day la gioi han TUYET DOI, khong phu thuoc thoi gian hay reservation khac.
     */
    private int getRestaurantTotalCapacity() {
        return tableRepository.findByIsActiveTrueAndDeletedAtIsNull()
                .stream()
                .mapToInt(Table::getCapacity)
                .sum();
    }

    /**
     * Validate partySize so voi tong suc chua nha hang - KHONG lien quan thoi gian.
     *
     * Khac voi hasCapacity():
     *   - hasCapacity() tra loi "con cho vao THOI DIEM nay khong" (phu thuoc booking khac).
     *   - Ham nay tra loi "nha hang co BAO GIO phuc vu duoc partySize nay khong".
     */
    private void validatePartySizeAgainstRestaurantCapacity(Integer partySize) {
        int totalCapacity = getRestaurantTotalCapacity();
        if (partySize > totalCapacity) {
            throw new BusinessException(
                    "So khach (" + partySize + ") vuot qua tong suc chua toi da hien co cua nha hang ("
                            + totalCapacity + " cho). Vui long lien he truc tiep nha hang de duoc ho tro rieng.");
        }
    }

    /**
     * Tim to hop ban nho nhat (it ban nhat, it lang phi nhat) co tong capacity >= partySize.
     * Dung subset-sum: voi moi tong co the dat duoc, chi giu lai to hop it ban nhat.
     */
    private List<Table> findBestTableCombination(List<Table> pool, int partySize) {
        if (pool.isEmpty()) return List.of();

        int maxCapacity = pool.stream()
                .map(Table::getCapacity)
                .max(Integer::compareTo)
                .orElse(0);
        int sumLimit = partySize + maxCapacity;

        Map<Integer, List<Table>> combinations = new HashMap<>();
        combinations.put(0, new ArrayList<>());

        pool.stream()
                .sorted(Comparator.comparingInt(Table::getCapacity))
                .forEach(table -> {
                    Map<Integer, List<Table>> snapshot = new HashMap<>(combinations);
                    snapshot.forEach((sum, tables) -> {
                        int newSum = sum + table.getCapacity();
                        if (newSum > sumLimit) return;

                        List<Table> candidate = new ArrayList<>(tables);
                        candidate.add(table);

                        List<Table> current = combinations.get(newSum);
                        if (current == null || candidate.size() < current.size()) {
                            combinations.put(newSum, candidate);
                        }
                    });
                });

        return combinations.entrySet()
                .stream()
                .filter(entry -> entry.getKey() >= partySize)
                .min(Comparator
                        .comparingInt((Map.Entry<Integer, List<Table>> entry) -> entry.getKey() - partySize)
                        .thenComparingInt(entry -> entry.getValue().size()))
                .map(Map.Entry::getValue)
                .orElse(List.of());
    }

    /**
     * Ghi lai cac "ban phu" (ngoai ban chinh da luu o tableId) vao note, theo dinh dang
     * vua doc duoc (cho nhan vien) vua parse lai duoc (cho code).
     * Vi du: "[Ghep ban] Can ke them ban: B05 (6 cho), B06 (6 cho). [GHEP_BAN:uuid1,uuid2]"
     */
    private String appendCombinedTablesNote(String existingNote, List<Table> secondaryTables) {
        String tableList = secondaryTables.stream()
                .map(t -> t.getNumber() + " (" + t.getCapacity() + " cho)")
                .collect(Collectors.joining(", "));
        String idList = secondaryTables.stream()
                .map(t -> t.getId().toString())
                .collect(Collectors.joining(","));

        String marker = COMBINED_TABLES_NOTE_PREFIX + " Can ke them ban: " + tableList
                + ". [GHEP_BAN:" + idList + "]";

        if (existingNote == null || existingNote.isBlank()) {
            return marker;
        }
        return existingNote + COMBINED_TABLES_SEPARATOR + marker;
    }

    /** Doc lai danh sach UUID ban phu da ghi trong note (xem appendCombinedTablesNote). */
    private List<UUID> extractCombinedTableIds(String note) {
        if (note == null) return List.of();
        Matcher matcher = COMBINED_TABLES_PATTERN.matcher(note);
        if (!matcher.find()) return List.of();
        return Arrays.stream(matcher.group(1).split(","))
                .map(UUID::fromString)
                .toList();
    }

    /** Xoa phan marker ghep ban khoi note sau khi da release, giu lai note goc cua khach (neu co). */
    private String stripCombinedTablesNote(String note) {
        if (note == null) return null;
        int markerIndex = note.indexOf(COMBINED_TABLES_NOTE_PREFIX);
        if (markerIndex < 0) return note;
        if (markerIndex == 0) return null;

        String before = note.substring(0, markerIndex);
        if (before.endsWith(COMBINED_TABLES_SEPARATOR)) {
            before = before.substring(0, before.length() - COMBINED_TABLES_SEPARATOR.length());
        }
        before = before.trim();
        return before.isBlank() ? null : before;
    }

    /**
     * Validate thoi gian dat ban:
     *   1. Khong duoc trong qua khu.
     *   2. Phai nam trong gio mo cua (OPEN_TIME -> CLOSE_TIME).
     */
    private void validateReservationTime(OffsetDateTime reservedAt) {
        OffsetDateTime now = OffsetDateTime.now(RESTAURANT_ZONE);

        if (!reservedAt.isAfter(now)) {
            throw new BusinessException("Thoi gian dat ban khong duoc la qua khu.");
        }

        LocalTime time = reservedAt.atZoneSameInstant(RESTAURANT_ZONE).toLocalTime();
        if (time.isBefore(OPEN_TIME) || time.isAfter(CLOSE_TIME)) {
            throw new BusinessException(
                    "Thoi gian dat ban phai trong gio hoat dong ("
                    + OPEN_TIME + " - " + CLOSE_TIME + ")."
            );
        }
    }

    /**
     * Giai phong ban cho reservation - bao gom CA ban chinh (tableId) VA cac ban phu
     * (neu co ghep ban, duoc parse lai tu note qua extractCombinedTableIds).
     */
    private void releaseTable(Reservation reservation) {
        extractCombinedTableIds(reservation.getNote()).forEach(tableId ->
                tableRepository.findById(tableId).ifPresent(table -> {
                    table.setStatus(TableStatus.EMPTY);
                    tableRepository.save(table);
                })
        );

        if (reservation.getTableId() != null) {
            tableRepository.findById(reservation.getTableId())
                    .ifPresent(table -> {
                        table.setStatus(TableStatus.EMPTY);
                        tableRepository.save(table);
                    });
            reservation.setTableId(null);
        }

        reservation.setNote(stripCombinedTablesNote(reservation.getNote()));
        reservationRepository.save(reservation);
    }

    private OffsetDateTime toStartOfDay(LocalDate date) {
        return date.atStartOfDay(RESTAURANT_ZONE).toOffsetDateTime();
    }

    private Reservation findOrThrow(UUID id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Khong tim thay thong tin dat ban: " + id));
    }

    private ReservationResponse toResponse(Reservation r) {
        return ReservationResponse.builder()
                .id(r.getId())
                .customerName(r.getCustomerName())
                .customerPhone(r.getCustomerPhone())
                .partySize(r.getPartySize())
                .reservedAt(r.getReservedAt())
                .note(r.getNote())
                .status(r.getStatus().name())
                .source(r.getSource().name())
                .tableId(r.getTableId())
                .confirmedBy(r.getConfirmedBy())
                .cancelledBy(r.getCancelledBy())
                .cancelReason(r.getCancelReason())
                .createdAt(r.getCreatedAt())
                .build();
    }

    // ================================================================== public API

    @Override
    @Transactional(readOnly = true)
    public Page<ReservationResponse> getReservations(LocalDate date, ReservationStatus status, Pageable pageable) {
        if (date != null && status != null) {
            OffsetDateTime start = toStartOfDay(date);
            return reservationRepository
                    .findByReservedAtBetweenAndStatus(start, start.plusDays(1), status, pageable)
                    .map(this::toResponse);
        }
        if (date != null) {
            OffsetDateTime start = toStartOfDay(date);
            return reservationRepository
                    .findByReservedAtBetweenOrderByReservedAtAsc(start, start.plusDays(1), pageable)
                    .map(this::toResponse);
        }
        if (status != null) {
            return reservationRepository.findByStatus(status, pageable).map(this::toResponse);
        }
        return reservationRepository.findAll(pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    // ------------------------------------------------------------------ create / confirm

    /**
     * Tao reservation o trang thai PENDING.
     *
     * Validate o buoc nay:
     *   1. Thoi gian dat ban hop le (khong qua khu, trong gio mo cua).
     *   2. partySize khong vuot tong suc chua TUYET DOI cua nha hang (bat ke gio nao).
     *
     * Capacity check theo KHUNG GIO cu the (phu thuoc cac booking khac) van duoc
     * de o buoc confirm.
     */
    @Override
    public ReservationResponse createReservation(CreateReservationRequest request, UUID staffId) {
        validateReservationTime(request.getReservedAt());
        validatePartySizeAgainstRestaurantCapacity(request.getPartySize());

        Reservation reservation = Reservation.builder()
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .partySize(request.getPartySize())
                .reservedAt(request.getReservedAt())
                .note(request.getNote())
                .source(staffId != null ? ReservationSource.STAFF : ReservationSource.ONLINE)
                .status(ReservationStatus.PENDING)
                .tableId(null)
                .build();

        return toResponse(reservationRepository.save(reservation));
    }

    /**
     * Confirm mot reservation PENDING.
     *
     * Kiem tra theo thu tu:
     *   1. Trang thai phai la PENDING.
     *   2. Gio dat khong duoc la qua khu / ngoai gio mo cua.
     *   3. Nha hang con du capacity cho partySize trong khung gio do (don le hoac ghep ban).
     *
     * Neu khong du capacity -> tu dong CANCELLED va nem BusinessException.
     * Luu y: confirm KHONG gan tableId cu the - viec gan ban (don hoac ghep) duoc
     * thuc hien rieng boi job autoAssignTables() gan gio den.
     */
    @Override
    public ReservationResponse confirmReservation(UUID id, UUID staffId) {
        Reservation reservation = findOrThrow(id);

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new BusinessException("Chi cho phep confirm reservation dang PENDING.");
        }

        validateReservationTime(reservation.getReservedAt());

        if (!hasCapacity(reservation.getPartySize(), reservation.getReservedAt(), reservation.getId())) {
            reservation.setStatus(ReservationStatus.CANCELLED);
            reservation.setCancelReason("Nha hang het ban phu hop trong khung gio nay.");
            reservationRepository.save(reservation);
            throw new BusinessException(
                    "Nha hang da het ban phu hop cho "
                    + reservation.getPartySize()
                    + " nguoi vao luc "
                    + reservation.getReservedAt().atZoneSameInstant(RESTAURANT_ZONE).toLocalTime()
                    + " ngay "
                    + reservation.getReservedAt().atZoneSameInstant(RESTAURANT_ZONE).toLocalDate()
                    + "."
            );
        }

        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservation.setConfirmedBy(staffId);
        return toResponse(reservationRepository.save(reservation));
    }

    // ------------------------------------------------------------------ update / lifecycle

    @Override
    public ReservationResponse update(UUID id, UpdateReservationRequest request) {
        Reservation r = findOrThrow(id);

        if (r.getStatus() != ReservationStatus.PENDING && r.getStatus() != ReservationStatus.CONFIRMED) {
            throw new BusinessException("Chi cho phep sua dat ban o trang thai PENDING hoac CONFIRMED.");
        }

        Integer        newPartySize  = request.getPartySize()  != null ? request.getPartySize()  : r.getPartySize();
        OffsetDateTime newReservedAt = request.getReservedAt() != null ? request.getReservedAt() : r.getReservedAt();

        validateReservationTime(newReservedAt);
        validatePartySizeAgainstRestaurantCapacity(newPartySize);

        if (!hasCapacity(newPartySize, newReservedAt, r.getId())) {
            throw new BusinessException("Khung gio moi khong con du cho " + newPartySize + " nguoi.");
        }

        if (request.getCustomerName()  != null) r.setCustomerName(request.getCustomerName());
        if (request.getCustomerPhone() != null) r.setCustomerPhone(request.getCustomerPhone());
        if (request.getPartySize()     != null) r.setPartySize(request.getPartySize());
        if (request.getReservedAt()    != null) r.setReservedAt(request.getReservedAt());
        if (request.getNote()          != null) r.setNote(request.getNote());

        return toResponse(reservationRepository.save(r));
    }

    @Override
    public ReservationResponse arrived(UUID id) {
        Reservation r = findOrThrow(id);

        if (r.getStatus() != ReservationStatus.CONFIRMED) {
            throw new BusinessException("Chi cho phep check-in voi dat ban da CONFIRMED.");
        }
        if (r.getTableId() == null) {
            throw new BusinessException("Dat ban nay chua duoc gan ban cu the.");
        }

        Table table = tableRepository.findById(r.getTableId())
                .orElseThrow(() -> new BusinessException("Khong tim thay ban da gan cho dat ban."));

        table.setStatus(TableStatus.SERVING);
        tableRepository.save(table);

        // Neu reservation nay duoc ghep nhieu ban, chuyen luon cac ban phu sang SERVING
        extractCombinedTableIds(r.getNote()).forEach(tableId ->
                tableRepository.findById(tableId).ifPresent(t -> {
                    t.setStatus(TableStatus.SERVING);
                    tableRepository.save(t);
                })
        );

        r.setStatus(ReservationStatus.ARRIVED);
        return toResponse(reservationRepository.save(r));
    }

    @Override
    public ReservationResponse cancel(UUID id, UUID cancelledBy, String reason) {
        Reservation r = findOrThrow(id);

        if (r.getStatus() == ReservationStatus.ARRIVED) {
            throw new BusinessException("Khach da den va dang dung bua, khong the huy.");
        }
        if (r.getStatus() == ReservationStatus.CANCELLED) {
            throw new BusinessException("Dat ban nay da duoc huy truoc do.");
        }

        releaseTable(r);
        r.setStatus(ReservationStatus.CANCELLED);
        if (cancelledBy != null) {
            r.setCancelledBy(cancelledBy);
        }
        r.setCancelReason(reason);
        return toResponse(reservationRepository.save(r));
    }

    @Override
    public void delete(UUID id) {
        Reservation reservation = findOrThrow(id);
        releaseTable(reservation);
        reservationRepository.delete(reservation);
    }

    // ------------------------------------------------------------------ scheduled jobs

    /**
     * Gan ban cho cac reservation CONFIRMED sap den gio (trong vong ASSIGN_BEFORE_MINUTES).
     *
     * Chien luoc 2 buoc:
     *   1. Uu tien tim MOT ban don le vua du partySize, lang phi cho it nhat.
     *   2. Neu khong co ban don le nao du -> thu ghep nhieu ban (findBestTableCombination)
     *      tu danh sach ban dang EMPTY. Ban LON NHAT trong to hop duoc luu vao
     *      reservation.tableId (ban chinh); cac ban con lai (ban phu) duoc danh dau
     *      RESERVED va ghi vao note de nhan vien biet can ke them ban nao.
     *
     * Neu khong tim duoc phuong an nao (don le hoac ghep) -> bo qua, cho lan chay
     * sau (60s/lan) hoac nhan vien tu xu ly thu cong.
     */
    @Scheduled(fixedRate = 60_000)
    @Override
    public void autoAssignTables() {
        OffsetDateTime now  = OffsetDateTime.now(RESTAURANT_ZONE);
        OffsetDateTime soon = now.plusMinutes(ASSIGN_BEFORE_MINUTES);

        reservationRepository.findUnassignedUpcoming(now, soon).forEach(this::tryAssignTable);
    }

    private void tryAssignTable(Reservation reservation) {
        List<Table> emptyTables = tableRepository
                .findByIsActiveTrueAndStatusAndDeletedAtIsNull(TableStatus.EMPTY);

        Optional<Table> singleTable = emptyTables.stream()
                .filter(t -> t.getCapacity() >= reservation.getPartySize())
                .min(Comparator.comparingInt(t -> t.getCapacity() - reservation.getPartySize()));

        if (singleTable.isPresent()) {
            assignSingleTable(reservation, singleTable.get());
            return;
        }

        List<Table> combination = findBestTableCombination(emptyTables, reservation.getPartySize());
        if (!combination.isEmpty()) {
            assignCombinedTables(reservation, combination);
        }
    }

    private void assignSingleTable(Reservation reservation, Table table) {
        table.setStatus(TableStatus.RESERVED);
        reservation.setTableId(table.getId());
        reservationRepository.save(reservation);
        tableRepository.save(table);
    }

    /**
     * Gan nhieu ban ghep cho 1 reservation - giai phap TAM, chua co bang trung gian
     * luu quan he 1-N giua reservation va table (xem comment o COMBINED_TABLES_*).
     */
    private void assignCombinedTables(Reservation reservation, List<Table> combination) {
        Table primaryTable = combination.stream()
                .max(Comparator.comparingInt(Table::getCapacity))
                .orElseThrow();

        List<Table> secondaryTables = combination.stream()
                .filter(t -> !t.getId().equals(primaryTable.getId()))
                .toList();

        combination.forEach(t -> t.setStatus(TableStatus.RESERVED));
        tableRepository.saveAll(combination);

        reservation.setTableId(primaryTable.getId());
        reservation.setNote(appendCombinedTablesNote(reservation.getNote(), secondaryTables));
        reservationRepository.save(reservation);
    }

    @Scheduled(fixedRate = 60_000)
    @Override
    public void autoCancelExpired() {
        OffsetDateTime cutoff = OffsetDateTime.now(RESTAURANT_ZONE).minusMinutes(AUTO_CANCEL_MINUTES);

        reservationRepository
                .findByStatusAndReservedAtBefore(ReservationStatus.CONFIRMED, cutoff)
                .forEach(r -> {
                    releaseTable(r);
                    r.setStatus(ReservationStatus.CANCELLED);
                    r.setCancelReason("He thong tu dong huy: qua " + AUTO_CANCEL_MINUTES + " phut so voi lich hen.");
                    reservationRepository.save(r);
                });
    }

    // ------------------------------------------------------------------ calendar

    @Override
    @Transactional(readOnly = true)
    public ReservationCalendarResponse getCalendar(LocalDate date) {
        OffsetDateTime start = toStartOfDay(date);
        List<Reservation> all = reservationRepository
                .findByReservedAtBetweenOrderByReservedAtAsc(start, start.plusDays(1));

        return ReservationCalendarResponse.builder()
                .date(date)
                .reservations(all.stream().map(this::toResponse).toList())
                .totalReservations(all.size())
                .pending  ((int) all.stream().filter(r -> r.getStatus() == ReservationStatus.PENDING  ).count())
                .confirmed((int) all.stream().filter(r -> r.getStatus() == ReservationStatus.CONFIRMED).count())
                .arrived  ((int) all.stream().filter(r -> r.getStatus() == ReservationStatus.ARRIVED  ).count())
                .cancelled((int) all.stream().filter(r -> r.getStatus() == ReservationStatus.CANCELLED).count())
                .build();
    }

    // ------------------------------------------------------------------ booking suggestion

    /**
     * Goi y lich dat ban dua theo cac ngay khach ranh.
     *
     * Khach cung cap:
     *   - preferredDates : danh sach ngay khach co the den
     *   - partySize      : so nguoi
     *
     * Ket qua: moi ngay con slot trong duoc tra ve kem danh sach gio co the dat.
     * Ngay nao khong con slot nao phu hop se bi loai khoi ket qua.
     *
     * Slot duoc tinh bang hasCapacity() - chi kiem tra capacity tong (don le hoac
     * ghep ban), khong gan ban cu the o buoc nay.
     */
    @Override
    @Transactional(readOnly = true)
    public List<BookingSuggestionResponse> suggestBookingSlots(List<LocalDate> preferredDates,
                                                               Integer partySize) {
        LocalDate      today   = LocalDate.now(RESTAURANT_ZONE);
        LocalDate      horizon = today.plusDays(BOOKING_HORIZON_DAYS);
        OffsetDateTime now     = OffsetDateTime.now(RESTAURANT_ZONE);

        return preferredDates.stream()
                .filter(date -> !date.isBefore(today) && date.isBefore(horizon))
                .sorted()
                .map(date -> {
                    // Slot cuoi phai ket thuc truoc CLOSE_TIME -> start toi da CLOSE_TIME - duration
                    LocalTime lastSlot = CLOSE_TIME.minusHours(RESERVATION_DURATION_HOURS);

                    List<LocalTime> slots = Stream
                            .iterate(OPEN_TIME,
                                     time -> !time.isAfter(lastSlot),
                                     time -> time.plusMinutes(SLOT_INTERVAL_MINUTES))
                            .map(time -> date.atTime(time).atZone(RESTAURANT_ZONE).toOffsetDateTime())
                            .filter(wantedTime -> wantedTime.isAfter(now))
                            .filter(wantedTime -> hasCapacity(partySize, wantedTime, null))
                            .map(wantedTime -> wantedTime.atZoneSameInstant(RESTAURANT_ZONE).toLocalTime())
                            .toList();

                    return BookingSuggestionResponse.builder()
                            .date(date)
                            .partySize(partySize)
                            .availableSlots(slots)
                            .build();
                })
                .filter(r -> !r.getAvailableSlots().isEmpty())
                .toList();
    }
}