package oak.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import oak.logic.BookLogic;
import oak.model.Book;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("/api/books")
public class BookController {
    
    private final BookLogic bookLogic = new BookLogic();

    // find book by id
    @GetMapping("/{id}")
    public ResponseEntity<Book> getBookById(@PathVariable int id){
        Book book = bookLogic.fetchBook(id);

        if(book != null){
            return ResponseEntity.ok(book);
        }
        return ResponseEntity.notFound().build();
    }

    // search books
    @GetMapping("/search")
    public ResponseEntity<List<Book>> searchBooks(
        @RequestParam(defaultValue = "is empty") String title,
        @RequestParam(defaultValue = "is empty") String genre,
        @RequestParam(defaultValue = "is empty") String freeText){
            List<Book> bookList = bookLogic.searchBooks(title, genre, freeText);
            
            if(bookList != null){
                return ResponseEntity.ok(bookList);
            }
            return ResponseEntity.notFound().build();
        }

}
