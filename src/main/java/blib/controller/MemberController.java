package blib.controller;

import blib.logic.MemberLogic;
import blib.logic.ReportLogic;

import blib.model.MemberStatusChange;
import blib.model.StatusTracking;
import blib.model.Member;
import blib.dto.RegisterRequest;
import blib.enums.FreezeStatus;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberLogic memberLogic = new MemberLogic();
    private final ReportLogic reportLogic = new ReportLogic();

    // view member data
    @GetMapping("/{id}")
    public ResponseEntity<Member> getMember(@PathVariable int id){
        Member member = memberLogic.fetchMemberById(id);
        if(member != null){
            return ResponseEntity.ok(member);
        }
        return ResponseEntity.notFound().build();
    }

    // update existing member
    @PutMapping("/{id}/edit-contact")
    public ResponseEntity<String> editContact(@PathVariable int id, @RequestParam String phone, @RequestParam String email){
        boolean updated = memberLogic.updateMemberContact(id, phone, email);

        if(updated){
            return ResponseEntity.ok("Contact information updated successfully");
        }
        return ResponseEntity.badRequest().body("Failed to update contact information");
    }

    // view all registered members
    @GetMapping("/all")
    public ResponseEntity<List<Member>> getAllMembers(){
        List<Member> memberList = memberLogic.fetchAllMembers();
        return ResponseEntity.ok(memberList);
    }

    // register a new member
    @PostMapping("/register")
    public ResponseEntity<?> registerContact(@RequestBody RegisterRequest request){
        String dupErrors = memberLogic.checkDuplicates(
            request.getMemberId(),
            request.getUserName(),
            request.getEmail()
        );

        // one of the inputs already exists in the db
        if(dupErrors != null){
            return ResponseEntity.badRequest().body(dupErrors);
        }

        Member newMember = memberLogic.registerNewMember(
            request.getMemberId(),
            request.getFullName(),
            request.getUserName(),
            request.getPassword(),
            FreezeStatus.NOT_FROZEN,
            request.getPhone(),
            request.getEmail()
        );

        if(newMember != null){
            reportLogic.saveMemberStatusChange(new MemberStatusChange(
                request.getMemberId(), request.getFullName(), FreezeStatus.NOT_FROZEN, LocalDate.now()
            ));
            reportLogic.updateStatusTracking(new StatusTracking(LocalDate.now(), 0, 1));
            return ResponseEntity.ok(newMember);
        }

        return ResponseEntity.status(500).body("Registration failed.");
    }

    // freezing/unfreezing a member
    @PutMapping("/{id}/freeze-status")
    public ResponseEntity<String> setMemberStatus(@PathVariable int id, @RequestParam String status, @RequestParam String date){
        try{
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
            LocalDate freezDate = LocalDate.parse(date, formatter);
            
            boolean setStatus = memberLogic.setFreezeStatus(id, status, freezDate);
            if(setStatus){
                Member member = memberLogic.fetchMemberById(id);
                reportLogic.saveMemberStatusChange(new MemberStatusChange(
                    member.getMemberId(), member.getFullName(), FreezeStatus.fromDbValue(status), freezDate)
                );

                if(member.getFreezeStatus() == FreezeStatus.NOT_FROZEN){
                    reportLogic.updateStatusTracking(new StatusTracking(LocalDate.now(), -1, 1));
                } else{
                    reportLogic.updateStatusTracking(new StatusTracking(LocalDate.now(), 1, -1));
                }

                return ResponseEntity.ok("Status updated successfully");
            }
            return ResponseEntity.badRequest().body("Failed to update status");
        
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.toString());
        }
    }

    // change login status when user logins\logouts
    @PutMapping("/{id}/login-status")
    public ResponseEntity<String> updateLoginStatus(@PathVariable int id, @RequestParam boolean status){
        boolean updated = memberLogic.ChangeLogInStatus(id, status);
        if(updated){
            return ResponseEntity.ok("Login status updated successfully");
        }
        return ResponseEntity.badRequest().body("Failed to update login status");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteMember(@PathVariable int id){
        if(memberLogic.deleteMember(id))
            return ResponseEntity.ok("Member deleted successfully");

        return ResponseEntity.badRequest().body("Failed to delete member");
    }
}
