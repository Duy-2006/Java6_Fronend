import java.sql.*;
public class CheckOrder {
    public static void main(String[] args) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/java5_db?user=root&password=");
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT order_code, order_type FROM orders ORDER BY id DESC LIMIT 5");
            while (rs.next()) {
                System.out.println("Order " + rs.getString(1) + " has orderType: " + rs.getString(2));
            }
        } catch(Exception e) {
            e.printStackTrace();
        }
    }
}
