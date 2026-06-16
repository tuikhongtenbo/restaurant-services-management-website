package com.restaurant.controller.customer;

import com.restaurant.common.utils.ApiResponse;
import com.restaurant.dto.response.customer.CustomerLookupResponse;
import com.restaurant.service.customer.CustomerManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/customers")
@RequiredArgsConstructor
public class PublicCustomerController {

    private final CustomerManagementService customerService;

    @GetMapping("/lookup")
    public ResponseEntity<ApiResponse<CustomerLookupResponse>> lookupCustomer(@RequestParam String phone) {
        CustomerLookupResponse response = customerService.lookupCustomer(phone);
        return ResponseEntity.ok(ApiResponse.success("Thông tin khách hàng", response));
    }
}
