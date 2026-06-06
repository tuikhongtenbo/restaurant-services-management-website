import java.sql.*;
public class DropCols {
    public static void main(String[] args) throws Exception {
        Connection c = DriverManager.getConnection("jdbc:postgresql://aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres", "postgres.bxglnufokfhhcmviisvd", "VGT5cpNKqBq7W2Mb");
        Statement s = c.createStatement();
        s.execute("ALTER TABLE menu_items DROP COLUMN IF EXISTS promo_start, DROP COLUMN IF EXISTS promo_end;");
        System.out.println("Done!");
    }
}
