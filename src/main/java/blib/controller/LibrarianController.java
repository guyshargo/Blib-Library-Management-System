package blib.controller;

import blib.logic.LibrarianLogic;
import blib.model.Librarian;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin
@RestController
@RequestMapping("/api/librarians")
public class LibrarianController {
    private final LibrarianLogic librarianLogic = new LibrarianLogic();

    @GetMapping("/{id}")
    public ResponseEntity<Librarian> getLibrarian(@PathVariable int id) {
        Librarian lib = librarianLogic.fetchLibrarianByID(id);
        if (lib != null) {
            return ResponseEntity.ok(lib);
        }
        return ResponseEntity.notFound().build();
    }

    // change login status when user logins\logouts
    @PutMapping("/{id}/login-status")
    public ResponseEntity<String> updateLoginStatus(@PathVariable int id, @RequestParam boolean status){
        boolean updated = librarianLogic.ChangeLogInStatus(id, status);
        if(updated){
            return ResponseEntity.ok("Login status updated successfully");
        }
        return ResponseEntity.badRequest().body("Failed to update login status");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteLibrarian(@PathVariable int id){
        if(librarianLogic.deleteLibrarian(id))
            return ResponseEntity.ok("Librarian deleted successfully");

        return ResponseEntity.badRequest().body("Failed to delete librarian");
    }
}
