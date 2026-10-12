package blib.controller;

import blib.logic.WaitlistLogic;
import blib.model.WaitlistEntry;
import blib.dto.OrderRequest; // Can share OrderRequest or create WaitlistRequest if needed, let's accept OrderRequest or generic body

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("/api/waitlist")
public class WaitlistController {

    private final WaitlistLogic waitlistLogic = new WaitlistLogic();

    @PostMapping("/")
    public ResponseEntity<String> joinWaitlist(@RequestBody OrderRequest request) {
        String result = waitlistLogic.joinWaitlist(
            request.getBookId(),
            request.getMemberId(),
            request.getMemberName(),
            request.getMemberPhone(),
            request.getMemberEmail()
        );
        if ("approve".equals(result)) {
            return ResponseEntity.ok("Successfully joined the waitlist.");
        } else if ("already_on_waitlist".equals(result)) {
            return ResponseEntity.badRequest().body("You are already on the waitlist for this title.");
        }
        return ResponseEntity.badRequest().body("Failed to join waitlist: " + result);
    }

    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<WaitlistEntry>> getWaitlistForMember(@PathVariable int memberId) {
        List<WaitlistEntry> list = waitlistLogic.getWaitlistForMember(memberId);
        return ResponseEntity.ok(list);
    }

    @DeleteMapping("/{waitlistId}")
    public ResponseEntity<String> leaveWaitlist(@PathVariable int waitlistId) {
        boolean success = waitlistLogic.leaveWaitlist(waitlistId);
        if (success) {
            return ResponseEntity.ok("Successfully left the waitlist.");
        }
        return ResponseEntity.badRequest().body("Failed to leave the waitlist.");
    }
}
