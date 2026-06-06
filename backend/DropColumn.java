import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DropColumn {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";
        String user = "postgres.bxglnufokfhhcmviisvd";
        String password = "VGT5cpNKqBq7W2Mb";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            stmt.executeUpdate("ALTER TABLE tables DROP COLUMN IF EXISTS status;");
            System.out.println("Column 'status' dropped successfully from 'tables'!");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
