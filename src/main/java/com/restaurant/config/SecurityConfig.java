package com.restaurant.config;

// TODO: THANG - Implement SecurityConfig
// - CORS configuration (cho phép frontend domain)
// - Stateless session
// - Role-based access: /api/auth/** permitAll, /api/admin/** hasRole(ADMIN|MANAGER), /api/kds/** hasRole(KITCHEN_STAFF)
// - Filter chain với JwtAuthenticationFilter
// - PasswordEncoder Bean (BCrypt)
// - AuthenticationManager Bean
