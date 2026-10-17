package oak.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import oak.logic.LibrarianLogic;
import oak.logic.MemberLogic;
import oak.model.Librarian;
import oak.model.Member;

@CrossOrigin
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final LibrarianLogic librarianLogic = new LibrarianLogic();
    private final MemberLogic memberLogic = new MemberLogic();

    @GetMapping("/login/librarian")
    public ResponseEntity<Librarian> loginLibrarian(@RequestParam String username, @RequestParam String password) {
        Librarian lib = librarianLogic.fetchLibrarianByUsername(username);
        if (lib != null && lib.getPassword().equals(password)) {
            return ResponseEntity.ok(lib);
        }
        return ResponseEntity.status(401).build();
    }

    @GetMapping("/login/member")
    public ResponseEntity<Member> loginMember(@RequestParam String username, @RequestParam String password) {
        Member member = memberLogic.fetchMemberByUsername(username);
        if (member != null && member.getPassword().equals(password)) {
            return ResponseEntity.ok(member);
        }
        return ResponseEntity.status(401).build();
    }
}