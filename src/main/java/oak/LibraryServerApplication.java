package oak;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LibraryServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(LibraryServerApplication.class, args);
        System.out.println("Spring Boot Backend Server is running on http://localhost:8080");
    }
}
