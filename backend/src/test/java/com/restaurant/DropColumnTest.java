package com.restaurant;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest
public class DropColumnTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void dropColumn() {
        try {
            jdbcTemplate.execute("ALTER TABLE tables DROP COLUMN IF EXISTS status;");
            System.out.println("====== COLUMN DROPPED SUCCESSFULLY ======");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
